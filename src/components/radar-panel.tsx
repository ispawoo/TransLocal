'use client';

import React, { useState, useRef } from 'react';
import { useAppStore, Peer } from '../store/useAppStore';
import { webRTCManager } from '../services/webrtc';
import { Smartphone, Monitor, Tablet, UploadCloud, Search, Info, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const RadarPanel: React.FC = () => {
  const { peers, deviceId, roomCode } = useAppStore();
  const peersList = Object.values(peers);
  const [dragActive, setDragActive] = useState(false);
  const [hoveredPeer, setHoveredPeer] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedPeerRef = useRef<string | null>(null);

  const getDeviceIcon = (type: Peer['deviceType']) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-6 h-6 text-brand-accent" />;
      case 'tablet':
        return <Tablet className="w-6 h-6 text-brand-accent" />;
      default:
        return <Monitor className="w-6 h-6 text-brand-accent" />;
    }
  };

  // Compute radial coordinates for peers on the radar
  const getPeerPosition = (index: number, total: number) => {
    if (total === 1) return { x: 0, y: -100 }; // Centered top
    
    const angle = (index * (2 * Math.PI)) / total - Math.PI / 2; // offset by 90deg to start top
    const radius = total > 4 ? 130 : 105; // Adjust distance based on crowd size
    
    return {
      x: Math.round(Math.cos(angle) * radius),
      y: Math.round(Math.sin(angle) * radius),
    };
  };

  // Drag and Drop triggers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, peerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      sendFilesToPeer(peerId, files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedPeerRef.current) {
      const files = Array.from(e.target.files);
      sendFilesToPeer(selectedPeerRef.current, files);
    }
  };

  const triggerFilePicker = (peerId: string) => {
    selectedPeerRef.current = peerId;
    fileInputRef.current?.click();
  };

  const sendFilesToPeer = (peerId: string, files: File[]) => {
    const manager = webRTCManager;
    if (!manager) return;
    files.forEach(file => {
      manager.initiateSendFile(peerId, file);
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />

      {/* Decorative gradient glow */}
      <div className="glow-blur-blue top-[15%] left-[20%]"></div>
      <div className="glow-blur-emerald bottom-[15%] right-[20%]"></div>

      {/* Main Radar Sphere (desktop only, swaps to list layout on small mobile) */}
      <div className="w-full max-w-lg aspect-square glass-panel rounded-full flex items-center justify-center relative shadow-2xl shadow-black/60 border border-white/5 overflow-hidden hidden md:flex">
        
        {/* Animated Sonar Rings */}
        <div className="radar-ring w-[140px] h-[140px]"></div>
        <div className="radar-ring w-[280px] h-[280px]"></div>
        <div className="radar-ring w-[420px] h-[420px]"></div>

        {/* Center Scanner Beam */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/5 via-transparent to-transparent rounded-full animate-[spin_8s_linear_infinite] pointer-events-none"></div>

        {/* Radar Crosshairs */}
        <div className="absolute w-full h-[1px] bg-white/5"></div>
        <div className="absolute h-full w-[1px] bg-white/5"></div>

        {/* Center Node (Self) */}
        <div className="relative z-10 w-24 h-24 rounded-full bg-slate-900/90 border border-brand-accent/40 flex flex-col items-center justify-center shadow-xl shadow-brand-accent/10">
          <div className="absolute inset-0 rounded-full bg-brand-accent/10 animate-ping"></div>
          <span className="text-3xl animate-pulse select-none">📡</span>
          <span className="text-[10px] font-bold text-brand-accent mt-1 tracking-widest uppercase">
            Scanning
          </span>
        </div>

        {/* Dynamic Discovered Peer Nodes */}
        <AnimatePresence>
          {peersList.map((peer, idx) => {
            const pos = getPeerPosition(idx, peersList.length);
            const isHovered = hoveredPeer === peer.id;

            return (
              <motion.div
                key={peer.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className="absolute z-20"
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                }}
              >
                <div
                  onMouseEnter={() => setHoveredPeer(peer.id)}
                  onMouseLeave={() => setHoveredPeer(null)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoveredPeer(peer.id);
                  }}
                  onDragLeave={() => setHoveredPeer(null)}
                  onDrop={(e) => handleDrop(e, peer.id)}
                  onClick={() => triggerFilePicker(peer.id)}
                  className={`w-20 h-20 rounded-2xl glass-panel glass-panel-hover flex flex-col items-center justify-center cursor-pointer relative transition-all duration-300 ${
                    isHovered ? 'scale-110 border-brand-accent' : ''
                  }`}
                >
                  {/* Floating drag helper border overlay */}
                  {isHovered && (
                    <div className="absolute inset-1 border-2 border-dashed border-brand-accent rounded-xl animate-[pulse_1.5s_infinite]"></div>
                  )}

                  <span className="text-2xl select-none mb-1">{peer.avatar}</span>
                  <span className="text-[10px] font-bold text-slate-200 truncate w-16 text-center">
                    {peer.name}
                  </span>
                  
                  <div className="absolute -bottom-2 bg-slate-900 border border-white/10 px-1.5 py-0.5 rounded-full text-[8px] flex items-center gap-0.5 text-slate-400">
                    {getDeviceIcon(peer.deviceType)}
                    <span className="capitalize">{peer.deviceType}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty Radar State Instruction overlay */}
        {peersList.length === 0 && (
          <div className="absolute bottom-10 inset-x-0 text-center px-6 pointer-events-none">
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Searching for peers connected to your local network. Connect other devices to this router to transfer files.
            </p>
          </div>
        )}
      </div>

      {/* Grid Fallback Layout (for smaller mobile screens and accessibility) */}
      <div className="w-full max-w-lg md:hidden flex flex-col gap-4 z-10">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Search className="w-4 h-4 text-brand-accent animate-pulse" />
            Discovered Devices ({peersList.length})
          </h2>
          {roomCode && (
            <span className="text-[10px] bg-brand-accent/10 border border-brand-accent/20 text-brand-accent px-2 py-0.5 rounded-full font-semibold">
              Room: {roomCode}
            </span>
          )}
        </div>

        {peersList.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[260px] border border-white/5">
            <div className="w-16 h-16 rounded-full bg-slate-900/60 border border-dashed border-white/10 flex items-center justify-center text-3xl mb-4 animate-[pulse_2s_infinite]">
              📡
            </div>
            <h3 className="font-bold text-slate-200 text-sm mb-1">
              Scanning for devices...
            </h3>
            <p className="text-xs text-slate-400 max-w-[280px]">
              Open this web app on another device connected to the same WiFi or Local Hotspot to start sharing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {peersList.map((peer) => (
              <button
                key={peer.id}
                onClick={() => triggerFilePicker(peer.id)}
                className="glass-panel glass-panel-hover p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer relative"
              >
                <span className="text-3xl mb-2 select-none">{peer.avatar}</span>
                <span className="text-xs font-bold text-slate-200 truncate w-32 mb-1">
                  {peer.name}
                </span>
                <div className="flex items-center gap-1 text-[9px] text-slate-400 bg-black/15 px-2 py-0.5 rounded-full border border-white/5">
                  {getDeviceIcon(peer.deviceType)}
                  <span className="capitalize">{peer.deviceType}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Helpful Hint banner at the bottom */}
      <div className="w-full max-w-lg mt-6 bg-slate-900/40 border border-white/5 p-3 rounded-2xl flex gap-3 text-left items-start z-10 glass-card">
        <Info className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-slate-200">How to transfer files?</p>
          <p className="text-slate-400 leading-normal mt-0.5">
            Click a device avatar to select and send files instantly. On desktops, you can also drag & drop files directly onto any device's radar icon.
          </p>
        </div>
      </div>
    </div>
  );
};
