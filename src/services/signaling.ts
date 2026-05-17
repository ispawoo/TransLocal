import { useAppStore, Peer } from '../store/useAppStore';

class SignalingService {
  private ws: WebSocket | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private serverUrl = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  
  // Custom event listeners
  private signalListeners: Array<(from: string, signal: any) => void> = [];
  private chatListeners: Array<(from: string, text: string) => void> = [];
  private transferRequestListeners: Array<(from: string, transferId: string, fileName: string, fileSize: number, fileType: string) => void> = [];
  private transferResponseListeners: Array<(from: string, transferId: string, accepted: boolean) => void> = [];
  private transferCancelListeners: Array<(from: string, transferId: string) => void> = [];

  constructor() {
    // Determine the default signaling URL
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Fallback is localhost:5000, but in production, we can configure via env
      const defaultUrl = `${protocol}//${window.location.hostname}:5000`;
      this.serverUrl = process.env.NEXT_PUBLIC_SIGNALING_URL || defaultUrl;
    }
  }

  public setServerUrl(url: string) {
    if (url === this.serverUrl) return;
    this.serverUrl = url;
    if (this.ws) {
      console.log(`[Signaling] Server URL updated. Reconnecting to: ${url}`);
      this.disconnect();
      this.connect();
    }
  }

  public getServerUrl() {
    return this.serverUrl;
  }

  public connect() {
    if (typeof window === 'undefined' || this.ws || this.isConnecting) return;
    
    this.isConnecting = true;
    console.log(`[Signaling] Connecting to signaling server at: ${this.serverUrl}`);

    try {
      this.ws = new WebSocket(this.serverUrl);
      
      this.ws.onopen = () => {
        console.log('[Signaling] WebSocket connection established.');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        useAppStore.getState().setWsConnected(true);
        useAppStore.getState().setSignalingError(null);
        
        this.joinRoom();
        this.startHeartbeat();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { type, data } = payload;
          
          switch (type) {
            case 'peers':
              this.handlePeers(data.peers);
              break;
            case 'signal':
              this.signalListeners.forEach(listener => listener(data.from, data.signal));
              break;
            case 'chat':
              this.handleChat(data.from, data.text);
              break;
            case 'transfer-request':
              this.transferRequestListeners.forEach(listener => 
                listener(data.from, data.transferId, data.fileName, data.fileSize, data.fileType)
              );
              break;
            case 'transfer-response':
              this.transferResponseListeners.forEach(listener => 
                listener(data.from, data.transferId, data.accepted)
              );
              break;
            case 'transfer-cancel':
              this.transferCancelListeners.forEach(listener => 
                listener(data.from, data.transferId)
              );
              break;
            case 'heartbeat-ack':
              // Server is healthy, ignore or log
              break;
            default:
              console.log('[Signaling] Received unknown message type:', type);
          }
        } catch (e) {
          console.error('[Signaling] Error parsing WebSocket message:', e);
        }
      };
      
      this.ws.onclose = () => {
        console.log('[Signaling] WebSocket connection closed.');
        this.handleDisconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('[Signaling] WebSocket error:', error);
        useAppStore.getState().setSignalingError('Connection failed. Server might be offline.');
        this.handleDisconnect();
      };

    } catch (e) {
      console.error('[Signaling] Failed to create WebSocket connection:', e);
      this.isConnecting = false;
      this.handleDisconnect();
    }
  }

  public disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }
    useAppStore.getState().setWsConnected(false);
    this.isConnecting = false;
  }

  private handleDisconnect() {
    this.ws = null;
    this.isConnecting = false;
    useAppStore.getState().setWsConnected(false);
    this.stopHeartbeat();
    
    // Auto reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 15000);
      console.log(`[Signaling] Reconnecting in ${delay / 1000}s... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      useAppStore.getState().setSignalingError('Connection lost. Please retry manually in settings.');
    }
  }

  public joinRoom() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    const store = useAppStore.getState();
    const joinPayload = {
      type: 'join',
      data: {
        id: store.deviceId,
        name: store.deviceName,
        avatar: store.deviceAvatar,
        deviceType: store.deviceType,
        roomCode: store.roomCode
      }
    };
    
    this.ws.send(JSON.stringify(joinPayload));
    console.log(`[Signaling] Sent join registration: ${store.deviceName} [Room: ${store.roomCode || 'LAN'}]`);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 10000); // Heartbeat every 10s
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handlePeers(peersList: Peer[]) {
    const store = useAppStore.getState();
    
    // Build quick index of active peers in the incoming list
    const incomingPeerIds = new Set(peersList.map(p => p.id));
    
    // Add or update active peers
    peersList.forEach(peer => {
      store.addOrUpdatePeer(peer);
    });
    
    // Remove peers that are no longer present in signaling response
    Object.keys(store.peers).forEach(peerId => {
      if (!incomingPeerIds.has(peerId)) {
        store.removePeer(peerId);
      }
    });
  }

  private handleChat(from: string, text: string) {
    const store = useAppStore.getState();
    const peer = store.peers[from];
    const senderName = peer?.name || 'Device';
    store.addChatMessage(from, senderName, text, false);
    
    this.chatListeners.forEach(listener => listener(from, text));
  }

  // Sending API
  public sendSignal(to: string, signal: any) {
    this.send({ type: 'signal', data: { to, signal } });
  }

  public sendChatMessage(to: string, text: string) {
    this.send({ type: 'chat', data: { to, text } });
    
    // Add to own chat history
    const store = useAppStore.getState();
    store.addChatMessage(to, store.deviceName, text, true);
  }

  public sendTransferRequest(to: string, transferId: string, fileName: string, fileSize: number, fileType: string) {
    this.send({
      type: 'transfer-request',
      data: { to, transferId, fileName, fileSize, fileType }
    });
  }

  public sendTransferResponse(to: string, transferId: string, accepted: boolean) {
    this.send({
      type: 'transfer-response',
      data: { to, transferId, accepted }
    });
  }

  public sendTransferCancel(to: string, transferId: string) {
    this.send({
      type: 'transfer-cancel',
      data: { to, transferId }
    });
  }

  private send(message: { type: string; data: any }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[Signaling] Failed to send message (Socket not open):', message.type);
    }
  }

  // Subscriptions
  public onSignal(callback: (from: string, signal: any) => void) {
    this.signalListeners.push(callback);
    return () => {
      this.signalListeners = this.signalListeners.filter(cb => cb !== callback);
    };
  }

  public onChat(callback: (from: string, text: string) => void) {
    this.chatListeners.push(callback);
    return () => {
      this.chatListeners = this.chatListeners.filter(cb => cb !== callback);
    };
  }

  public onTransferRequest(
    callback: (from: string, transferId: string, fileName: string, fileSize: number, fileType: string) => void
  ) {
    this.transferRequestListeners.push(callback);
    return () => {
      this.transferRequestListeners = this.transferRequestListeners.filter(cb => cb !== callback);
    };
  }

  public onTransferResponse(callback: (from: string, transferId: string, accepted: boolean) => void) {
    this.transferResponseListeners.push(callback);
    return () => {
      this.transferResponseListeners = this.transferResponseListeners.filter(cb => cb !== callback);
    };
  }

  public onTransferCancel(callback: (from: string, transferId: string) => void) {
    this.transferCancelListeners.push(callback);
    return () => {
      this.transferCancelListeners = this.transferCancelListeners.filter(cb => cb !== callback);
    };
  }
}

export const signalingService = new SignalingService();
export default signalingService;
