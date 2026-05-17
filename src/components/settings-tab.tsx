'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { usePWA } from './pwa-provider';
import { signalingService } from '../services/signaling';
import { Download, Check, RefreshCw, QrCode, Sliders, Shield, Settings, Users, Monitor } from 'lucide-react';
import QRCode from 'qrcode';

const EMOJIS = ['🦊', '🦅', '🐆', '🐬', '🦦', '🐈', '🐳', '🚀', '🛸', '🛰️', '🤖', '👾', '🌟', '❄️', '🔥', '⚡'];

export const SettingsTab: React.FC = () => {
  const { 
    deviceName, 
    deviceAvatar, 
    roomCode, 
    settings, 
    updateIdentity, 
    updateSetting,
    setRoomCode
  } = useAppStore();

  const { isInstallable, isInstalled, triggerInstall } = usePWA();

  const [nameInput, setNameInput] = useState(deviceName);
  const [selectedAvatar, setSelectedAvatar] = useState(deviceAvatar);
  const [roomInput, setRoomInput] = useState(roomCode);
  const [signalingUrlInput, setSignalingUrlInput] = useState(signalingService.getServerUrl());
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  // Sync inputs with store on mount
  useEffect(() => {
    setNameInput(deviceName);
    setSelectedAvatar(deviceAvatar);
    setRoomInput(roomCode);
  }, [deviceName, deviceAvatar, roomCode]);

  // Generate QR code for mobile pairing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Construct pairing link containing current hostname + room code
    const pairingLink = roomCode 
      ? `${window.location.origin}?room=${roomCode}`
      : `${window.location.origin}`;

    QRCode.toDataURL(pairingLink, {
      width: 180,
      margin: 1.5,
      color: {
        dark: '#0B0F19',
        light: '#F8FAFC'
      }
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('[Settings] QR code generation failed:', err));
  }, [roomCode]);

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    updateIdentity(nameInput.trim(), selectedAvatar);
    
    // Notify signaling server
    signalingService.joinRoom();
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedCode = roomInput.trim().toUpperCase();
    setRoomCode(formattedCode);
    
    // Disconnect and reconnect using the new room
    signalingService.disconnect();
    signalingService.connect();

    setJoinSuccess(true);
    setTimeout(() => setJoinSuccess(false), 2000);
  };

  const handleResetRoom = () => {
    setRoomInput('');
    setRoomCode('');
    
    // Disconnect and reconnect
    signalingService.disconnect();
    signalingService.connect();
  };

  const handleUpdateSignalingUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signalingUrlInput.trim()) return;
    
    signalingService.setServerUrl(signalingUrlInput.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const generateRandomRoom = () => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    setRoomInput(code);
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6 p-4 md:p-8 z-10 select-text">
      
      {/* Settings Navigation sidebar */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* PWA Install Banner */}
        {isInstallable && !isInstalled && (
          <div className="glass-panel p-5 rounded-3xl border border-brand-accent/20 bg-gradient-to-tr from-brand-accent/10 to-indigo-950/20 text-left relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-accent/10 rounded-full blur-xl"></div>
            
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-2xl shrink-0">
                📲
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm">
                  Install TransLocal Web App
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed max-w-[280px]">
                  Get full offline caching, desktop shortcuts, and native-app behavior for seamless LAN transfers.
                </p>
              </div>
            </div>

            <button
              onClick={triggerInstall}
              className="py-2.5 px-5 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-accent/20 transition-all shrink-0 active:scale-95 cursor-pointer"
            >
              Install App
            </button>
          </div>
        )}

        {/* Identity & Profile Card */}
        <div className="glass-panel rounded-3xl p-6 text-left border border-white/5 bg-slate-900/10">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-accent" />
            Device Profile
          </h3>

          <form onSubmit={handleSaveIdentity} className="mt-4 flex flex-col gap-4">
            {/* Avatar Emoji picker */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">
                Select Avatar Emoji
              </label>
              <div className="grid grid-cols-8 gap-2 mt-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`p-2 text-2xl rounded-xl transition-all select-none hover:bg-white/5 active:scale-90 ${
                      selectedAvatar === emoji
                        ? 'bg-brand-accent/20 border border-brand-accent/40 shadow-inner'
                        : 'border border-transparent'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Rename input */}
            <div className="flex flex-col gap-1.5 mt-2">
              <label htmlFor="device-name" className="text-[11px] font-bold text-slate-500 uppercase">
                Device Display Name
              </label>
              <div className="flex gap-2">
                <input
                  id="device-name"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter custom device name..."
                  className="flex-1 glass-input py-2 px-3 rounded-xl text-xs text-white"
                />
                <button
                  type="submit"
                  className="py-2 px-4 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  {saveSuccess ? <Check className="w-3.5 h-3.5" /> : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Core Transfer Settings */}
        <div className="glass-panel rounded-3xl p-6 text-left border border-white/5 bg-slate-900/10">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#10B981]" />
            Preferences & Security
          </h3>

          <div className="flex flex-col gap-4 mt-5">
            {/* Auto Accept */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Auto-Accept Transfers</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Bypass accept prompt drawers. Instantly transfer incoming files from peers.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.autoAccept}
                  onChange={(e) => updateSetting('autoAccept', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-950/80 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-accent peer-checked:after:bg-white"></div>
              </label>
            </div>

            <hr className="border-white/5" />

            {/* Auto Download */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Trigger Automatic Downloads</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Immediately trigger the browser's download prompt when WebRTC receives 100% of a file.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.autoDownload}
                  onChange={(e) => updateSetting('autoDownload', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-950/80 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-accent peer-checked:after:bg-white"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Advanced Signaling Configuration */}
        <div className="glass-panel rounded-3xl p-6 text-left border border-white/5 bg-slate-900/10">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            Signaling Server Node (Advanced)
          </h3>

          <form onSubmit={handleUpdateSignalingUrl} className="mt-4 flex flex-col gap-2">
            <label htmlFor="signaling-url" className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">
              WebSocket Signaling Endpoint
            </label>
            <div className="flex gap-2">
              <input
                id="signaling-url"
                type="text"
                value={signalingUrlInput}
                onChange={(e) => setSignalingUrlInput(e.target.value)}
                placeholder="ws://localhost:5000"
                className="flex-1 glass-input py-2 px-3 rounded-xl text-xs text-white"
              />
              <button
                type="submit"
                className="py-2 px-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-300 hover:text-white transition-all text-xs font-bold active:scale-95 cursor-pointer"
              >
                Reconnect
              </button>
            </div>
            <p className="text-[9px] text-slate-500 mt-1 leading-normal">
              Used to discover peers. Swap this with a custom local IP address (e.g. <code className="text-slate-400">ws://192.168.1.15:5000</code>) when operating in offline local networks with a dedicated local server.
            </p>
          </form>
        </div>

      </div>

      {/* Room code & QR Code Sidebar */}
      <div className="w-full md:w-[320px] flex flex-col gap-6">
        
        {/* QR Pairing Code panel */}
        <div className="glass-panel rounded-3xl p-6 text-center border border-white/5 bg-slate-900/10 flex flex-col items-center">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 self-start">
            <QrCode className="w-4 h-4 text-brand-accent" />
            Instant Pairing QR Code
          </h3>
          
          <p className="text-[10px] text-slate-500 mt-1 text-left leading-relaxed">
            Scan this QR code with your smartphone camera to immediately load the web app and pair on the exact same discovery room.
          </p>

          {/* QR Container */}
          <div className="my-5 p-3 rounded-2xl bg-white flex items-center justify-center border border-white/10 shadow-inner select-none">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Pairing QR code" className="w-[180px] h-[180px]" />
            ) : (
              <div className="w-[180px] h-[180px] bg-slate-950/20 rounded-xl animate-pulse"></div>
            )}
          </div>

          <span className="text-[9px] bg-brand-accent/10 border border-brand-accent/20 text-brand-accent font-bold px-3 py-1 rounded-full uppercase tracking-widest leading-none">
            {roomCode ? `Active Room: ${roomCode}` : 'Discovery: Local LAN Subnet'}
          </span>
        </div>

        {/* Room Join panel */}
        <div className="glass-panel rounded-3xl p-6 text-left border border-white/5 bg-slate-900/10">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Users className="w-4 h-4 text-brand-accent" />
            Manual Room Code Fallback
          </h3>
          
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
            Discovery normally matches devices sharing the same router IP. If discovery fails or you are on different networks, input a matching 4-letter Room Code.
          </p>

          <form onSubmit={handleJoinRoom} className="mt-4 flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                placeholder="4-LETTER CODE"
                className="flex-1 glass-input py-2 px-3 rounded-xl text-xs text-white font-bold tracking-widest text-center"
              />
              <button
                type="button"
                onClick={generateRandomRoom}
                className="py-2 px-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-400 hover:text-white transition-all text-xs font-bold"
                title="Generate Random"
              >
                Gen
              </button>
            </div>
            
            <div className="flex gap-2">
              {roomCode && (
                <button
                  type="button"
                  onClick={handleResetRoom}
                  className="flex-1 py-2 px-3 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-slate-400 hover:text-slate-300 font-bold active:scale-95"
                >
                  Clear Room
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-2 px-3 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {joinSuccess ? 'Joined!' : 'Join Room'}
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
};
