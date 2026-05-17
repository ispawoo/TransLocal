import { signalingService } from './signaling';
import { useAppStore, Transfer } from '../store/useAppStore';

const CHUNK_SIZE = 65536; // 64KB optimal chunk size for WebRTC DataChannel
const BUFFER_THRESHOLD = 1048576; // 1MB buffer limit to prevent overflow

interface PeerConnectionState {
  peerConnection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  fileBuffer: ArrayBuffer[];
  bytesReceived: number;
  transferId?: string;
  activeFile?: File;
  metaReceived?: {
    transferId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  };
  candidateQueue?: RTCIceCandidateInit[];
}

class WebRTCManager {
  // Map of peerId -> connection state
  private connections: Record<string, PeerConnectionState> = {};
  
  // Keep track of ongoing file objects to be sent
  private pendingFiles: Record<string, File> = {};

  constructor() {
    if (typeof window === 'undefined') return;
    
    // Subscribe to signaling events
    signalingService.onSignal((from, signal) => this.handleSignal(from, signal));
    signalingService.onTransferRequest((from, transferId, name, size, type, senderName, senderAvatar) => 
      this.handleIncomingRequest(from, transferId, name, size, type, senderName, senderAvatar)
    );
    signalingService.onTransferResponse((from, transferId, accepted) => 
      this.handleTransferResponse(from, transferId, accepted)
    );
    signalingService.onTransferCancel((from, transferId) => 
      this.handleTransferCancel(from, transferId)
    );
  }

  // Create WebRTC connection configuration
  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalingService.sendSignal(peerId, { candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${peerId} changed to: ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.cleanupConnection(peerId, 'Connection failed or disconnected');
      }
    };

    return pc;
  }

  // Handle incoming signaling offers, answers, and candidates
  private async handleSignal(from: string, signal: any) {
    try {
      let state = this.connections[from];

      if (!state) {
        // Create connection if not already present
        const pc = this.createPeerConnection(from);
        state = {
          peerConnection: pc,
          fileBuffer: [],
          bytesReceived: 0
        };
        this.connections[from] = state;

        // Set up WebRTC data channel event listeners for receivers
        pc.ondatachannel = (event) => {
          console.log(`[WebRTC] Received DataChannel from ${from}`);
          this.setupDataChannel(from, event.channel);
        };
      }

      const pc = state.peerConnection;

      if (signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        
        if (signal.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          signalingService.sendSignal(from, { sdp: pc.localDescription });
        }

        // Process any queued ICE candidates now that remote description is set
        if (state.candidateQueue && state.candidateQueue.length > 0) {
          console.log(`[WebRTC] Processing ${state.candidateQueue.length} queued ICE candidates for peer ${from}`);
          for (const cand of state.candidateQueue) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {
              console.error('[WebRTC] Error adding queued ICE candidate:', e);
            }
          }
          state.candidateQueue = [];
        }
      } else if (signal.candidate) {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } else {
          // Buffer candidate until remote description is processed
          if (!state.candidateQueue) {
            state.candidateQueue = [];
          }
          state.candidateQueue.push(signal.candidate);
          console.log(`[WebRTC] Buffered ICE candidate from ${from} (SDP not yet set)`);
        }
      }
    } catch (err) {
      console.error('[WebRTC] Error handling signal:', err);
    }
  }

  // Send request to transfer file
  public initiateSendFile(peerId: string, file: File): string {
    const transferId = 'tx_' + Math.random().toString(36).substr(2, 9);
    
    // Cache file for when user accepts
    this.pendingFiles[transferId] = file;

    // Start send transfer status in store
    useAppStore.getState().startSendTransfer(transferId, peerId, file.name, file.size, file.type);
    
    // Notify peer via signaling server
    signalingService.sendTransferRequest(peerId, transferId, file.name, file.size, file.type);
    
    console.log(`[WebRTC] Initiated file transfer ${transferId} to peer ${peerId}`);
    return transferId;
  }

  // Handle transfer request accepted/declined by peer
  private handleTransferResponse(from: string, transferId: string, accepted: boolean) {
    const store = useAppStore.getState();
    const file = this.pendingFiles[transferId];

    if (!file) {
      console.warn(`[WebRTC] Received response for non-existent transfer: ${transferId}`);
      return;
    }

    if (!accepted) {
      console.log(`[WebRTC] Peer ${from} declined transfer: ${transferId}`);
      store.updateTransferStatus(transferId, 'declined');
      delete this.pendingFiles[transferId];
      return;
    }

    // Peer accepted, let's start WebRTC connection as the initiator
    console.log(`[WebRTC] Peer ${from} accepted transfer: ${transferId}. Establishing P2P connection...`);
    store.updateTransferStatus(transferId, 'connecting');
    this.startSendingP2P(from, transferId, file);
  }

  // Start peer-to-peer connection for sending
  private async startSendingP2P(peerId: string, transferId: string, file: File) {
    try {
      // 1. Create Peer Connection
      const pc = this.createPeerConnection(peerId);
      
      // 2. Create DataChannel
      const channel = pc.createDataChannel('fileTransfer', { ordered: true });
      
      this.connections[peerId] = {
        peerConnection: pc,
        dataChannel: channel,
        fileBuffer: [],
        bytesReceived: 0,
        transferId,
        activeFile: file
      };

      this.setupDataChannel(peerId, channel);

      // 3. Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // 4. Send SDP Offer
      signalingService.sendSignal(peerId, { sdp: pc.localDescription });

    } catch (err) {
      console.error('[WebRTC] Error initiating P2P connection:', err);
      this.cleanupConnection(peerId, 'P2P setup failed');
    }
  }

  // Handle incoming request from other peer
  private handleIncomingRequest(
    from: string,
    transferId: string,
    fileName: string,
    fileSize: number,
    fileType: string,
    senderName?: string,
    senderAvatar?: string
  ) {
    const store = useAppStore.getState();
    
    // Auto-accept checking
    if (store.settings.autoAccept) {
      console.log(`[WebRTC] Auto-accepting transfer ${transferId} from ${from}`);
      this.acceptTransfer(from, transferId);
      return;
    }

    store.startReceiveTransfer(transferId, from, fileName, fileSize, fileType, senderName, senderAvatar);
  }

  // Accept incoming transfer
  public acceptTransfer(peerId: string, transferId: string) {
    const store = useAppStore.getState();
    const transfer = store.transfers[transferId];
    
    if (!transfer) return;

    store.updateTransferStatus(transferId, 'connecting');
    
    // Cache the expected meta
    const state = this.connections[peerId] || {
      peerConnection: this.createPeerConnection(peerId),
      fileBuffer: [],
      bytesReceived: 0
    };
    
    state.transferId = transferId;
    state.metaReceived = {
      transferId,
      fileName: transfer.fileName,
      fileSize: transfer.fileSize,
      fileType: transfer.fileType
    };
    
    this.connections[peerId] = state;

    // Send accept response to initiator
    signalingService.sendTransferResponse(peerId, transferId, true);
  }

  // Decline incoming transfer
  public declineTransfer(peerId: string, transferId: string) {
    const store = useAppStore.getState();
    store.updateTransferStatus(transferId, 'declined');
    signalingService.sendTransferResponse(peerId, transferId, false);
  }

  // Cancel transfer (either sender or receiver)
  public cancelTransfer(peerId: string, transferId: string) {
    const store = useAppStore.getState();
    store.updateTransferStatus(transferId, 'cancelled');
    
    // Notify peer
    signalingService.sendTransferCancel(peerId, transferId);
    this.cleanupConnection(peerId, 'Transfer cancelled by user');
  }

  private handleTransferCancel(from: string, transferId: string) {
    const store = useAppStore.getState();
    const transfer = store.transfers[transferId];
    if (transfer) {
      store.updateTransferStatus(transferId, 'cancelled', 'Cancelled by other device');
    }
    this.cleanupConnection(from, 'Transfer cancelled by peer');
  }

  // Setup DataChannel listeners
  private setupDataChannel(peerId: string, channel: RTCDataChannel) {
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      console.log(`[WebRTC] DataChannel opened with peer: ${peerId}`);
      
      const state = this.connections[peerId];
      if (state && state.activeFile && state.transferId) {
        // We are the SENDER. Start sending file.
        this.sendFileChunks(peerId, state.transferId, state.activeFile);
      }
    };

    channel.onmessage = (event) => {
      this.handleIncomingChunk(peerId, event.data);
    };

    channel.onclose = () => {
      console.log(`[WebRTC] DataChannel closed for peer: ${peerId}`);
      // Only treat it as an error/failure if the transfer wasn't already completed successfully
      const transferId = this.connections[peerId]?.transferId;
      const currentTx = transferId ? useAppStore.getState().transfers[transferId] : null;
      if (currentTx && currentTx.status !== 'completed') {
        this.cleanupConnection(peerId, 'DataChannel closed prematurely');
      } else {
        this.cleanupConnection(peerId);
      }
    };

    channel.onerror = (err) => {
      console.error(`[WebRTC] DataChannel error for peer ${peerId}:`, err);
      this.cleanupConnection(peerId, 'DataChannel error occurred');
    };
  }

  // Sender logic: Slice and pipe file chunks
  private async sendFileChunks(peerId: string, transferId: string, file: File) {
    const state = this.connections[peerId];
    if (!state || !state.dataChannel) return;

    const channel = state.dataChannel;
    const store = useAppStore.getState();
    
    store.updateTransferStatus(transferId, 'transferring');

    let offset = 0;
    const fileSize = file.size;
    let startTime = Date.now();
    let lastTime = startTime;
    let lastBytes = 0;

    // Send metadata header first
    const metaHeader = JSON.stringify({
      type: 'meta',
      transferId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    channel.send(metaHeader);

    const readSlice = (o: number): Promise<ArrayBuffer> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result instanceof ArrayBuffer) {
            resolve(e.target.result);
          } else {
            reject(new Error('Failed to read slice'));
          }
        };
        reader.onerror = reject;
        const slice = file.slice(o, o + CHUNK_SIZE);
        reader.readAsArrayBuffer(slice);
      });
    };

    const sendNextChunk = async () => {
      // Check if connection or channel is closed/cancelled
      if (!this.connections[peerId] || channel.readyState !== 'open') {
        return;
      }
      
      const currentStatus = store.transfers[transferId]?.status;
      if (currentStatus === 'cancelled' || currentStatus === 'failed') {
        return;
      }

      while (offset < fileSize) {
        // Backpressure/Flow Control: wait if buffer exceeds threshold
        if (channel.bufferedAmount > BUFFER_THRESHOLD) {
          channel.onbufferedamountlow = () => {
            channel.onbufferedamountlow = null;
            sendNextChunk(); // Resume sending
          };
          return;
        }

        try {
          const buffer = await readSlice(offset);
          channel.send(buffer);
          offset += buffer.byteLength;

          // Compute stats
          const now = Date.now();
          const progress = Math.min(Math.round((offset / fileSize) * 100), 100);
          
          if (now - lastTime >= 500 || progress === 100) {
            const timeDiff = (now - startTime) / 1000; // seconds
            const speed = timeDiff > 0 ? offset / timeDiff : 0; // bytes/sec
            const remainingBytes = fileSize - offset;
            const eta = speed > 0 ? Math.round(remainingBytes / speed) : 0;

            store.updateTransferProgress(transferId, progress, offset, speed, eta);
            lastTime = now;
            lastBytes = offset;
          }

        } catch (err) {
          console.error('[WebRTC] File reading/sending error:', err);
          store.updateTransferStatus(transferId, 'failed', 'Error reading/sending file data');
          this.cleanupConnection(peerId, 'Sending failed');
          return;
        }
      }

      // Check if finished
      if (offset >= fileSize) {
        channel.send(JSON.stringify({ type: 'eof', transferId }));
        store.updateTransferStatus(transferId, 'completed');
        console.log(`[WebRTC] Successfully sent file ${file.name} to ${peerId}`);
        
        // Cleanup cache
        delete this.pendingFiles[transferId];
        
        // Wait a short delay before closing the WebRTC connection
        // to let the receiver safely process the EOF and assemble the file without race conditions
        setTimeout(() => {
          this.cleanupConnection(peerId);
        }, 1500);
      }
    };

    // Kickoff the loop
    sendNextChunk();
  }

  // Receiver logic: Assemble chunks and trigger download
  private handleIncomingChunk(peerId: string, data: any) {
    const state = this.connections[peerId];
    if (!state) return;

    const store = useAppStore.getState();

    // 1. Text header check (Meta or control message)
    if (typeof data === 'string') {
      try {
        const payload = JSON.parse(data);
        
        if (payload.type === 'meta') {
          console.log('[WebRTC] Received metadata block:', payload);
          state.transferId = payload.transferId;
          state.metaReceived = {
            transferId: payload.transferId,
            fileName: payload.fileName,
            fileSize: payload.fileSize,
            fileType: payload.fileType
          };
          state.fileBuffer = [];
          state.bytesReceived = 0;
          
          store.updateTransferStatus(payload.transferId, 'transferring');
        } 
        
        else if (payload.type === 'eof') {
          const transferId = state.transferId || payload.transferId;
          const meta = state.metaReceived;
          
          if (!transferId || !meta) {
            console.warn('[WebRTC] Received EOF but no active meta details found!');
            return;
          }

          console.log(`[WebRTC] Completed receiving all bytes. Assembling file...`);
          
          // Assemble
          const blob = new Blob(state.fileBuffer, { type: meta.fileType });
          const url = URL.createObjectURL(blob);
          
          store.setTransferPreview(transferId, url);
          store.updateTransferStatus(transferId, 'completed');
          
          // Trigger download if set to auto-download
          if (store.settings.autoDownload) {
            const a = document.createElement('a');
            a.href = url;
            a.download = meta.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
          
          this.cleanupConnection(peerId);
        }
      } catch (e) {
        console.error('[WebRTC] Failed to parse Text Channel payload:', e);
      }
      return;
    }

    // 2. Binary chunks processing
    const meta = state.metaReceived;
    const transferId = state.transferId;

    if (!transferId || !meta) {
      console.warn('[WebRTC] Dropping binary chunk: No metadata header received yet.');
      return;
    }

    state.fileBuffer.push(data);
    state.bytesReceived += data.byteLength;

    // Throttle progress dispatch
    const now = Date.now();
    const progress = Math.min(Math.round((state.bytesReceived / meta.fileSize) * 100), 100);
    
    // Periodically update progress (every 500ms or on completion)
    const isCompleted = state.bytesReceived >= meta.fileSize;
    
    // We compute speed using the start time of the transfer
    const transfer = store.transfers[transferId];
    if (transfer) {
      const duration = (now - transfer.timestamp) / 1000;
      const speed = duration > 0 ? state.bytesReceived / duration : 0;
      const remainingBytes = meta.fileSize - state.bytesReceived;
      const eta = speed > 0 ? Math.round(remainingBytes / speed) : 0;
      
      store.updateTransferProgress(transferId, progress, state.bytesReceived, speed, eta);
    }
  }

  // Cleanup peer connection resources
  public cleanupConnection(peerId: string, errorReason?: string) {
    const state = this.connections[peerId];
    if (!state) return;

    console.log(`[WebRTC] Cleaning up WebRTC resources for peer: ${peerId}. Reason: ${errorReason || 'Finished'}`);
    
    const store = useAppStore.getState();

    // Set failed status in store if ended with error and is still in active status
    if (errorReason && state.transferId) {
      const currentTx = store.transfers[state.transferId];
      if (currentTx && (currentTx.status === 'transferring' || currentTx.status === 'connecting' || currentTx.status === 'pending')) {
        store.updateTransferStatus(state.transferId, 'failed', errorReason);
      }
    }

    // Close channel and connection
    if (state.dataChannel) {
      state.dataChannel.onopen = null;
      state.dataChannel.onmessage = null;
      state.dataChannel.onclose = null;
      state.dataChannel.onerror = null;
      try {
        state.dataChannel.close();
      } catch (e) {}
    }

    state.peerConnection.onicecandidate = null;
    state.peerConnection.onconnectionstatechange = null;
    state.peerConnection.ondatachannel = null;
    try {
      state.peerConnection.close();
    } catch (e) {}

    // Delete connection
    delete this.connections[peerId];
  }
}

let webRTCManager: WebRTCManager | undefined = undefined;
if (typeof window !== 'undefined') {
  webRTCManager = new WebRTCManager();
}

export { webRTCManager };
export default webRTCManager;
