const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const os = require('os');

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.send({ status: 'ok', peersConnected: wss.clients.size });
});

// Serve a static info page if visited
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; padding: 40px; text-align: center; background: #0B0F19; color: #fff; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h1 style="color: #4F8CFF; font-size: 2.5rem; margin-bottom: 10px;">TransLocal Signaling Server</h1>
      <p style="color: #94A3B8; font-size: 1.1rem; max-width: 600px;">
        This server handles WebRTC signaling, peer discovery, and fallback rooms for offline-first local network file sharing.
      </p>
      <div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
        <p style="margin: 5px 0;"><strong>Active Peers:</strong> ${wss.clients.size}</p>
        <p style="margin: 5px 0; color: #10B981;"><strong>Status:</strong> Online and Ready</p>
      </div>
      <p style="margin-top: 40px; font-size: 0.85rem; color: #64748B;">TransLocal &copy; ${new Date().getFullYear()}</p>
    </div>
  `);
});

// Keep track of connected clients
// Map of connectionId -> client Info
const clients = new Map();

function getClientIp(req) {
  // Try custom headers first (Vercel, Cloudflare, etc.)
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const xRealIp = req.headers['x-real-ip'];
  if (xRealIp) {
    return xRealIp;
  }
  return req.socket.remoteAddress;
}

wss.on('connection', (ws, req) => {
  const ipAddress = getClientIp(req);
  let clientId = null;
  let clientRoom = null;

  console.log(`[Signaling] New connection from IP: ${ipAddress}`);

  ws.on('message', (message) => {
    try {
      const payload = JSON.parse(message);
      const { type, data } = payload;

      switch (type) {
        case 'join': {
          const { id, name, avatar, deviceType, roomCode } = data;
          clientId = id;
          clientRoom = roomCode || '';

          // Save client metadata
          clients.set(clientId, {
            ws,
            id,
            name,
            avatar,
            deviceType,
            ipAddress,
            roomCode: clientRoom,
            lastSeen: Date.now()
          });

          console.log(`[Signaling] Peer joined: ${name} (${deviceType}) [IP: ${ipAddress}, Room: ${clientRoom || 'LAN-Auto'}]`);

          // Broadcast peer list update to all matching peers
          broadcastPeerList(clientId);
          break;
        }

        case 'heartbeat': {
          if (clientId && clients.has(clientId)) {
            const client = clients.get(clientId);
            client.lastSeen = Date.now();
            
            // Periodically reply to let client know server is alive
            ws.send(JSON.stringify({ type: 'heartbeat-ack' }));
          }
          break;
        }

        case 'signal': {
          const { to, signal } = data;
          if (to && clients.has(to)) {
            const targetClient = clients.get(to);
            if (targetClient.ws.readyState === WebSocket.OPEN) {
              targetClient.ws.send(JSON.stringify({
                type: 'signal',
                data: {
                  from: clientId,
                  signal
                }
              }));
            }
          }
          break;
        }

        case 'chat': {
          const { to, text } = data;
          if (to && clients.has(to)) {
            const targetClient = clients.get(to);
            if (targetClient.ws.readyState === WebSocket.OPEN) {
              targetClient.ws.send(JSON.stringify({
                type: 'chat',
                data: {
                  from: clientId,
                  text
                }
              }));
            }
          }
          break;
        }

        case 'transfer-request': {
          const { to, transferId, fileName, fileSize, fileType, senderName, senderAvatar } = data;
          if (to && clients.has(to)) {
            const targetClient = clients.get(to);
            if (targetClient.ws.readyState === WebSocket.OPEN) {
              targetClient.ws.send(JSON.stringify({
                type: 'transfer-request',
                data: {
                  from: clientId,
                  transferId,
                  fileName,
                  fileSize,
                  fileType,
                  senderName,
                  senderAvatar
                }
              }));
            }
          }
          break;
        }

        case 'transfer-response': {
          const { to, transferId, accepted } = data;
          if (to && clients.has(to)) {
            const targetClient = clients.get(to);
            if (targetClient.ws.readyState === WebSocket.OPEN) {
              targetClient.ws.send(JSON.stringify({
                type: 'transfer-response',
                data: {
                  from: clientId,
                  transferId,
                  accepted
                }
              }));
            }
          }
          break;
        }

        case 'transfer-cancel': {
          const { to, transferId } = data;
          if (to && clients.has(to)) {
            const targetClient = clients.get(to);
            if (targetClient.ws.readyState === WebSocket.OPEN) {
              targetClient.ws.send(JSON.stringify({
                type: 'transfer-cancel',
                data: {
                  from: clientId,
                  transferId
                }
              }));
            }
          }
          break;
        }

        default:
          console.warn(`[Signaling] Unknown message type: ${type}`);
      }
    } catch (err) {
      console.error('[Signaling] Failed to parse message:', err);
    }
  });

  ws.on('close', () => {
    if (clientId) {
      console.log(`[Signaling] Peer disconnected: ${clientId}`);
      clients.delete(clientId);
      // Notify other peers in the subnet/room
      broadcastPeerList(clientId);
    }
  });

  ws.on('error', (err) => {
    console.error(`[Signaling] WS error for client ${clientId}:`, err);
  });
});

// Helper to broadcast lists of nearby peers (sharing same IP subnet or same roomCode)
function broadcastPeerList(originatorId) {
  const originator = clients.get(originatorId);
  
  // Clean up stale clients (no heartbeat for 30s)
  const now = Date.now();
  for (const [id, client] of clients.entries()) {
    if (now - client.lastSeen > 30000) {
      console.log(`[Signaling] Pruning stale peer: ${client.name} (${id})`);
      client.ws.terminate();
      clients.delete(id);
    }
  }

  // Group clients by criteria (IP subnet or Room Code)
  for (const [id, client] of clients.entries()) {
    if (client.ws.readyState !== WebSocket.OPEN) continue;

    const nearbyPeers = [];

    for (const [otherId, otherClient] of clients.entries()) {
      if (otherId === id) continue; // Exclude self
      
      const sameRoom = client.roomCode && otherClient.roomCode && client.roomCode.toLowerCase() === otherClient.roomCode.toLowerCase();
      const sameNetwork = !client.roomCode && !otherClient.roomCode && client.ipAddress === otherClient.ipAddress;
      
      if (sameRoom || sameNetwork) {
        nearbyPeers.push({
          id: otherClient.id,
          name: otherClient.name,
          avatar: otherClient.avatar,
          deviceType: otherClient.deviceType,
          ip: otherClient.ipAddress,
          roomCode: otherClient.roomCode
        });
      }
    }

    // Send the customized peer list to this specific client
    client.ws.send(JSON.stringify({
      type: 'peers',
      data: {
        peers: nearbyPeers
      }
    }));
  }
}

// Log local interfaces so user knows the network address
function logLocalIPs() {
  const interfaces = os.networkInterfaces();
  console.log('\n====================================================');
  console.log('TRANSLOCAL SIGNALING SERVER INITIALIZED');
  console.log('====================================================');
  console.log(`Port: ${PORT}`);
  console.log('\nConnect to this signaling server inside your LAN:');
  
  Object.keys(interfaces).forEach((ifaceName) => {
    interfaces[ifaceName].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`- ws://${iface.address}:${PORT}`);
      }
    });
  });
  console.log(`- Local loopback: ws://localhost:${PORT}`);
  console.log('====================================================\n');
}

server.listen(PORT, () => {
  logLocalIPs();
});
