'use client';

import React from 'react';
import { Shield, Share2, WifiOff, HardDrive, Smartphone, Monitor, ChevronRight } from 'lucide-react';

export const AboutTab: React.FC = () => {
  return (
    <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col p-4 md:p-8 z-10 select-text text-left">
      
      {/* Decorative background glow */}
      <div className="glow-blur-blue top-[20%] left-[30%]"></div>

      {/* Brand Header Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 bg-gradient-to-tr from-brand-bg to-slate-900/60 relative overflow-hidden mb-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#4F8CFF]/5 rounded-full blur-xl"></div>
        
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-[#4F8CFF] to-[#10B981] flex items-center justify-center shadow-xl shadow-brand-accent/20 shrink-0">
          <span className="text-3.5xl font-extrabold text-white tracking-tighter">TL</span>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">TransLocal</h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">
            Offline-First Peer-to-Peer File Sharing Protocol
          </p>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-md">
            TransLocal transfers folders, files, and synced clipboard content directly between local devices without uploading a single byte to the internet.
          </p>
        </div>
      </div>

      {/* Key Architectural Pillars */}
      <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-4 px-1">
        Core Pillars
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Pillar 1: WebRTC */}
        <div className="glass-card p-5 rounded-2xl border border-white/5 flex gap-4 bg-slate-900/10">
          <Share2 className="w-6 h-6 text-brand-accent shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-slate-200">WebRTC DataChannels</h4>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              Creates direct peer-to-peer binary socket connections. Data streams from one device's RAM directly into the other, delivering extreme LAN speeds.
            </p>
          </div>
        </div>

        {/* Pillar 2: Offline First */}
        <div className="glass-card p-5 rounded-2xl border border-white/5 flex gap-4 bg-slate-900/10">
          <WifiOff className="w-6 h-6 text-brand-success shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-slate-200">100% Offline-LAN Capable</h4>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              Doesn't require active internet connection! The PWA shell caches assets and allows transfers if both devices are connected to the same local WiFi router.
            </p>
          </div>
        </div>

        {/* Pillar 3: E2E Privacy */}
        <div className="glass-card p-5 rounded-2xl border border-white/5 flex gap-4 bg-slate-900/10">
          <Shield className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-slate-200">Zero Cloud Intermediaries</h4>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              WebSocket signaling servers only act as introductions to let peers shake hands. The signaling nodes never see, store, or forward any of your files.
            </p>
          </div>
        </div>

        {/* Pillar 4: Zero login */}
        <div className="glass-card p-5 rounded-2xl border border-white/5 flex gap-4 bg-slate-900/10">
          <HardDrive className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-slate-200">No Auth, No Limits</h4>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              Start sharing files instantly! No account login, email registration, or subscription tiers. Transfer files of any size without capping.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Workflow visualization */}
      <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-4 px-1">
        How it Works
      </h3>

      <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-slate-900/15 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 text-center md:text-left">
        
        {/* Device A */}
        <div className="flex flex-col items-center gap-2 max-w-[140px]">
          <div className="w-12 h-12 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-center text-xl">
            💻
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200 leading-tight">Laptop (Sender)</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Slices files into 64KB chunks</p>
          </div>
        </div>

        {/* Step Arrow */}
        <div className="flex flex-col items-center gap-1 text-slate-500 shrink-0">
          <ChevronRight className="w-5 h-5 text-brand-accent animate-[pulse_1.5s_infinite] rotate-90 md:rotate-0" />
          <span className="text-[9px] uppercase tracking-widest font-bold text-brand-accent">WebSockets</span>
          <span className="text-[8px] text-slate-600">IP Subnet Signaling</span>
        </div>

        {/* Device B */}
        <div className="flex flex-col items-center gap-2 max-w-[140px]">
          <div className="w-12 h-12 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-center text-xl">
            📱
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200 leading-tight">Mobile (Receiver)</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Shakes hands and accepts P2P</p>
          </div>
        </div>

        {/* Direct P2P Arrow */}
        <div className="flex flex-col items-center gap-1 text-slate-500 shrink-0">
          <ChevronRight className="w-5 h-5 text-[#10B981] animate-[pulse_1.5s_infinite] rotate-90 md:rotate-0" />
          <span className="text-[9px] uppercase tracking-widest font-bold text-[#10B981]">WebRTC</span>
          <span className="text-[8px] text-slate-600">Direct DataChannel</span>
        </div>

        {/* Completed */}
        <div className="flex flex-col items-center gap-2 max-w-[140px]">
          <div className="w-12 h-12 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-center text-xl">
            💾
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200 leading-tight">Saved locally</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Assembled in browser RAM</p>
          </div>
        </div>

      </div>

      {/* Brand copy block */}
      <div className="text-center text-[10px] text-slate-600 py-4 font-semibold tracking-wider uppercase border-t border-white/5 mt-4">
        TransLocal P2P Core v1.0.0 • open source
      </div>

    </div>
  );
};
