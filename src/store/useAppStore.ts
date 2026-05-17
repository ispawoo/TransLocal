import { create } from 'zustand';

export interface Peer {
  id: string;
  name: string;
  avatar: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  ip?: string;
  roomCode?: string;
  lastSeen: number;
}

export interface Transfer {
  id: string;
  peerId: string;
  peerName: string;
  peerAvatar: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  type: 'send' | 'receive';
  status: 'pending' | 'connecting' | 'transferring' | 'completed' | 'declined' | 'failed' | 'cancelled';
  progress: number; // 0 to 100
  bytesTransferred: number;
  speed: number; // bytes/sec
  eta: number; // seconds
  error?: string;
  timestamp: number;
  text?: string; // for text/link sharing
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  peerId: string;
  peerName: string;
  text: string;
  timestamp: number;
  isSelf: boolean;
}

interface AppSettings {
  autoAccept: boolean;
  autoDownload: boolean;
  theme: 'dark' | 'light' | 'system';
  deviceName: string;
  deviceAvatar: string;
}

interface AppState {
  // Identity
  deviceId: string;
  deviceName: string;
  deviceAvatar: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  roomCode: string;
  
  // Connection State
  wsConnected: boolean;
  signalingError: string | null;
  peers: Record<string, Peer>;
  
  // Active Transfers
  transfers: Record<string, Transfer>;
  
  // Chat/Clipboard sharing
  chatHistory: Record<string, ChatMessage[]>; // keyed by peerId
  
  // Settings
  settings: AppSettings;
  
  // Actions
  initializeIdentity: () => void;
  updateIdentity: (name: string, avatar: string) => void;
  setWsConnected: (connected: boolean) => void;
  setSignalingError: (error: string | null) => void;
  setRoomCode: (code: string) => void;
  
  // Peer actions
  addOrUpdatePeer: (peer: Peer) => void;
  removePeer: (id: string) => void;
  cleanupInactivePeers: () => void;
  
  // Transfer actions
  startSendTransfer: (id: string, peerId: string, fileName: string, fileSize: number, fileType: string) => void;
  startReceiveTransfer: (id: string, peerId: string, fileName: string, fileSize: number, fileType: string) => void;
  updateTransferProgress: (id: string, progress: number, bytesTransferred: number, speed: number, eta: number) => void;
  updateTransferStatus: (id: string, status: Transfer['status'], error?: string) => void;
  setTransferPreview: (id: string, previewUrl: string) => void;
  
  // Chat actions
  addChatMessage: (peerId: string, peerName: string, text: string, isSelf: boolean) => void;
  clearChat: (peerId: string) => void;
  
  // Settings actions
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

// Generate random animal-like names for fun discovery identities
const ADJECTIVES = ['Sleek', 'Quantum', 'Hyper', 'Swift', 'Apex', 'Cyber', 'Cosmic', 'Solar', 'Aero', 'Prism', 'Vortex', 'Stellar', 'Neon'];
const ANIMALS = ['Fox', 'Falcon', 'Cheetah', 'Leopard', 'Eagle', 'Hawk', 'Dolphin', 'Panther', 'Phoenix', 'Otter', 'Jaguar', 'Lynx', 'Orca'];
const EMOJIS = ['🦊', '🦅', '🐆', '🐆', '🦅', '🦅', '🐬', '🐆', '🦅', '🦦', '🐆', '🐈', '🐳', '🚀', '🛸', '🛰️', '🤖', '👾', '🌟', '❄️', '🔥', '⚡'];

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const generateRandomName = () => `${getRandomElement(ADJECTIVES)} ${getRandomElement(ANIMALS)}`;
const generateDeviceId = () => {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('translocal_device_id');
    if (cached) return cached;
    const newId = 'dev_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('translocal_device_id', newId);
    return newId;
  }
  return 'dev_server';
};

const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
  return 'desktop';
};

export const useAppStore = create<AppState>((set, get) => ({
  deviceId: '',
  deviceName: '',
  deviceAvatar: '',
  deviceType: 'desktop',
  roomCode: '',
  wsConnected: false,
  signalingError: null,
  peers: {},
  transfers: {},
  chatHistory: {},
  settings: {
    autoAccept: false,
    autoDownload: true,
    theme: 'dark',
    deviceName: '',
    deviceAvatar: '',
  },

  initializeIdentity: () => {
    if (typeof window === 'undefined') return;
    
    const id = generateDeviceId();
    const type = getDeviceType();
    
    // Load config from localStorage
    let name = localStorage.getItem('translocal_device_name') || '';
    let avatar = localStorage.getItem('translocal_device_avatar') || '';
    let autoAccept = localStorage.getItem('translocal_auto_accept') === 'true';
    let autoDownload = localStorage.getItem('translocal_auto_download') !== 'false'; // default true
    let theme = (localStorage.getItem('translocal_theme') || 'dark') as 'dark' | 'light' | 'system';
    
    if (!name) {
      name = generateRandomName();
      localStorage.setItem('translocal_device_name', name);
    }
    if (!avatar) {
      avatar = getRandomElement(EMOJIS);
      localStorage.setItem('translocal_device_avatar', avatar);
    }
    
    set({
      deviceId: id,
      deviceName: name,
      deviceAvatar: avatar,
      deviceType: type,
      settings: {
        autoAccept,
        autoDownload,
        theme,
        deviceName: name,
        deviceAvatar: avatar,
      }
    });
  },

  updateIdentity: (name, avatar) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('translocal_device_name', name);
    localStorage.setItem('translocal_device_avatar', avatar);
    
    set((state) => ({
      deviceName: name,
      deviceAvatar: avatar,
      settings: {
        ...state.settings,
        deviceName: name,
        deviceAvatar: avatar,
      }
    }));
  },

  setWsConnected: (connected) => set({ wsConnected: connected }),
  setSignalingError: (error) => set({ signalingError: error }),
  setRoomCode: (code) => set({ roomCode: code }),

  addOrUpdatePeer: (peer) => set((state) => {
    if (peer.id === state.deviceId) return state; // Ignore self
    
    return {
      peers: {
        ...state.peers,
        [peer.id]: {
          ...state.peers[peer.id],
          ...peer,
          lastSeen: Date.now()
        }
      }
    };
  }),

  removePeer: (id) => set((state) => {
    const newPeers = { ...state.peers };
    delete newPeers[id];
    return { peers: newPeers };
  }),

  cleanupInactivePeers: () => set((state) => {
    const now = Date.now();
    const activePeers: Record<string, Peer> = {};
    let changed = false;
    
    Object.entries(state.peers).forEach(([id, peer]) => {
      // If peer hasn't been seen in 15 seconds, consider it gone
      if (now - peer.lastSeen < 15000) {
        activePeers[id] = peer;
      } else {
        changed = true;
      }
    });
    
    return changed ? { peers: activePeers } : state;
  }),

  startSendTransfer: (id, peerId, fileName, fileSize, fileType) => set((state) => {
    const peer = state.peers[peerId];
    return {
      transfers: {
        ...state.transfers,
        [id]: {
          id,
          peerId,
          peerName: peer?.name || 'Unknown',
          peerAvatar: peer?.avatar || '❓',
          fileName,
          fileSize,
          fileType,
          type: 'send',
          status: 'pending',
          progress: 0,
          bytesTransferred: 0,
          speed: 0,
          eta: 0,
          timestamp: Date.now()
        }
      }
    };
  }),

  startReceiveTransfer: (id, peerId, fileName, fileSize, fileType) => set((state) => {
    const peer = state.peers[peerId];
    return {
      transfers: {
        ...state.transfers,
        [id]: {
          id,
          peerId,
          peerName: peer?.name || 'Unknown',
          peerAvatar: peer?.avatar || '❓',
          fileName,
          fileSize,
          fileType,
          type: 'receive',
          status: 'pending',
          progress: 0,
          bytesTransferred: 0,
          speed: 0,
          eta: 0,
          timestamp: Date.now()
        }
      }
    };
  }),

  updateTransferProgress: (id, progress, bytesTransferred, speed, eta) => set((state) => {
    if (!state.transfers[id]) return state;
    return {
      transfers: {
        ...state.transfers,
        [id]: {
          ...state.transfers[id],
          progress,
          bytesTransferred,
          speed,
          eta
        }
      }
    };
  }),

  updateTransferStatus: (id, status, error) => set((state) => {
    if (!state.transfers[id]) return state;
    
    // Save details to completed history if complete
    return {
      transfers: {
        ...state.transfers,
        [id]: {
          ...state.transfers[id],
          status,
          ...(error ? { error } : {})
        }
      }
    };
  }),

  setTransferPreview: (id, previewUrl) => set((state) => {
    if (!state.transfers[id]) return state;
    return {
      transfers: {
        ...state.transfers,
        [id]: {
          ...state.transfers[id],
          previewUrl
        }
      }
    };
  }),

  addChatMessage: (peerId, peerName, text, isSelf) => set((state) => {
    const message: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      peerId,
      peerName,
      text,
      timestamp: Date.now(),
      isSelf
    };
    
    const peerChat = state.chatHistory[peerId] || [];
    return {
      chatHistory: {
        ...state.chatHistory,
        [peerId]: [...peerChat, message]
      }
    };
  }),

  clearChat: (peerId) => set((state) => {
    const newChatHistory = { ...state.chatHistory };
    delete newChatHistory[peerId];
    return { chatHistory: newChatHistory };
  }),

  updateSetting: (key, value) => set((state) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`translocal_${key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)}`, String(value));
    }
    
    return {
      settings: {
        ...state.settings,
        [key]: value
      }
    };
  })
}));
