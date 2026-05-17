'use client';

import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { usePWA } from './pwa-provider';
import { Wifi, WifiOff, RefreshCw, Smartphone, Monitor, Tablet, HelpCircle } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { deviceName, deviceAvatar, deviceType, wsConnected } = useAppStore();
  const { isOnline } = usePWA();

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-brand-accent" />;
      case 'tablet':
        return <Tablet className="w-4 h-4 text-brand-accent" />;
      default:
        return <Monitor className="w-4 h-4 text-brand-accent" />;
    }
  };

  const navItems = [
    { id: 'discover', label: 'Nearby Devices' },
    { id: 'clipboard', label: 'Clipboard & Chat' },
    { id: 'history', label: 'Transfers' },
    { id: 'settings', label: 'Settings' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header className="w-full glass-panel border-x-0 border-t-0 sticky top-0 z-40 px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Brand logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4F8CFF] to-[#10B981] flex items-center justify-center shadow-lg shadow-brand-accent/20">
          <span className="text-xl font-bold text-white tracking-tight">TL</span>
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            TransLocal
          </h1>
          <p className="text-[10px] text-slate-400 tracking-wide uppercase font-semibold">
            P2P LAN Transfer
          </p>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="flex items-center bg-black/35 rounded-full p-1 border border-white/5 overflow-x-auto max-w-full no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === item.id
                ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Identity & Status Indicators */}
      <div className="flex items-center gap-3">
        {/* Network status badges */}
        <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1.5 rounded-lg border border-white/5 text-[11px]">
          {isOnline ? (
            <div className="flex items-center gap-1 text-[#10B981]">
              <Wifi className="w-3.5 h-3.5" />
              <span className="font-semibold">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-rose-500 animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="font-semibold">LAN Only</span>
            </div>
          )}
          
          <span className="w-1 h-3 bg-white/10 mx-1"></span>

          {wsConnected ? (
            <div className="flex items-center gap-1 text-[#4F8CFF]">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping"></span>
              <span>Signaling Ok</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Connecting...</span>
            </div>
          )}
        </div>

        {/* Identity Badge */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/5 hover:border-brand-accent/20 transition-colors duration-300 py-1.5 pl-2 pr-3.5 rounded-xl">
          <span className="text-xl select-none" role="img" aria-label="avatar">
            {deviceAvatar}
          </span>
          <div className="text-left leading-tight hidden xs:block">
            <p className="text-[11px] font-semibold max-w-[100px] truncate text-slate-200">
              {deviceName}
            </p>
            <div className="flex items-center gap-1 text-[9px] text-slate-400">
              {getDeviceIcon()}
              <span className="capitalize">You</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
