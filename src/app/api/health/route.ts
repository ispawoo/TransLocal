import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
    framework: 'Next.js 15 (App Router)',
    version: '1.0.0',
    features: {
      signalingServer: 'Node.js + ws',
      webrtcP2p: 'RTCPeerConnection + RTCDataChannel',
      pwaInstalled: true,
      e2eeSecure: true,
      discoveryStrategy: ['IP Subnet automatic match', 'Room Code manual fallback', 'QR code mobile pairing']
    }
  });
}
