'use client';

import React from 'react';
import { Shield, Share2, WifiOff, HardDrive, Smartphone, Monitor, ChevronRight, Coffee } from 'lucide-react';

export const AboutTab: React.FC = () => {
  return (
    <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col p-4 md:p-8 z-10 select-text text-left">
      
      {/* Decorative background glow */}
      <div className="glow-blur-blue top-[20%] left-[30%]"></div>

      {/* Brand Header Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 bg-gradient-to-tr from-brand-bg to-slate-900/60 relative overflow-hidden mb-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#4F8CFF]/5 rounded-full blur-xl"></div>
        
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl overflow-hidden shadow-xl shadow-brand-accent/20 shrink-0 select-none">
          <img 
            src="/logo.jpg" 
            alt="TransLocal Logo" 
            className="w-full h-full object-cover"
          />
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

      {/* Author Credits Card */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-slate-950/60 to-slate-900/40 relative overflow-hidden mt-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-[#10B981]/5 rounded-full blur-xl"></div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#4F8CFF] to-[#10B981] p-0.5 shadow-lg shadow-brand-accent/20 shrink-0 overflow-hidden relative group select-none">
            <img 
              src="/author-avatar.jpg" 
              alt="Yasir Ispawoo" 
              className="w-full h-full rounded-full object-cover border border-slate-900 group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-white tracking-tight">Created by Yasir Ispawoo</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-sm">
              An open-source developer passionate about building high-performance, private, and offline-first peer-to-peer web applications.
            </p>
            {/* Social Links */}
            <div className="flex justify-center sm:justify-start items-center gap-3 mt-3">
              <a 
                href="https://linkedin.com/in/ispawoo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-[#4F8CFF] hover:bg-white/10 hover:border-[#4F8CFF]/30 transition-all duration-300"
                title="Follow on LinkedIn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a 
                href="https://github.com/ispawoo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                title="Follow on GitHub"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">@ispawoo</span>
            </div>
          </div>
        </div>

        {/* Buy Me a Coffee Button */}
        <a
          href="https://buymeacoffee.com/ispawoo"
          target="_blank"
          rel="noopener noreferrer"
          className="relative group flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FFDD00] via-[#F4B400] to-[#E9A000] text-slate-950 font-bold text-xs shadow-lg shadow-[#FFDD00]/10 hover:shadow-[#FFDD00]/25 hover:scale-105 active:scale-95 transition-all duration-300 shrink-0 select-none cursor-pointer"
        >
          <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <Coffee className="w-4 h-4 text-slate-950 animate-bounce group-hover:scale-110 transition-transform duration-300" />
          <span>Buy Me a Coffee</span>
        </a>
      </div>

      {/* Brand copy block */}
      <div className="text-center text-[10px] text-slate-600 py-4 font-semibold tracking-wider uppercase border-t border-white/5">
        TransLocal P2P Core v1.0.0 • open source
      </div>

    </div>
  );
};
