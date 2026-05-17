'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { signalingService } from '../services/signaling';
import { Navbar } from '../components/navbar';
import { RadarPanel } from '../components/radar-panel';
import { SharedClipboard } from '../components/shared-clipboard';
import { HistoryTab } from '../components/history-tab';
import { SettingsTab } from '../components/settings-tab';
import { AboutTab } from '../components/about-tab';
import { TransferModal } from '../components/transfer-modal';
import { usePWA } from '../components/pwa-provider';
import { AlertTriangle, Download, Info, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { 
    initializeIdentity, 
    wsConnected, 
    signalingError, 
    cleanupInactivePeers,
    setRoomCode
  } = useAppStore();

  const { isOnline } = usePWA();
  const [activeTab, setActiveTab] = useState<string>('discover');

  // Initialize identity and signaling connection
  useEffect(() => {
    // 1. Initialise Zustand store values
    initializeIdentity();

    // 2. Parse room query param if user scanned QR code
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        console.log(`[App] Initializing with scanned room code: ${roomParam}`);
        setRoomCode(roomParam.trim().toUpperCase());
      }
    }

    // 3. Connect to signaling server
    signalingService.connect();

    // 4. Repeated cleanup check for inactive peers every 8 seconds
    const interval = setInterval(() => {
      cleanupInactivePeers();
    }, 8000);

    return () => {
      clearInterval(interval);
      signalingService.disconnect();
    };
  }, [initializeIdentity, cleanupInactivePeers, setRoomCode]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'discover':
        return <RadarPanel />;
      case 'clipboard':
        return <SharedClipboard />;
      case 'history':
        return <HistoryTab />;
      case 'settings':
        return <SettingsTab />;
      case 'about':
        return <AboutTab />;
      default:
        return <RadarPanel />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0B0F19] relative">
      
      {/* Dynamic blurred light blobs for glassmorphism vibes */}
      <div className="absolute top-[10%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-brand-accent/5 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] right-[20%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/5 blur-[150px] pointer-events-none z-0"></div>

      {/* Main Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Connection & Network Status Warning banner */}
      <AnimatePresence>
        {signalingError && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full bg-amber-500/10 border-b border-amber-500/20 text-amber-500 py-2.5 px-4 text-xs font-bold text-center z-30 flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{signalingError}</span>
            <button 
              onClick={() => {
                signalingService.disconnect();
                signalingService.connect();
              }}
              className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-600 hover:text-amber-500 transition-colors uppercase text-[9px] font-extrabold flex items-center gap-0.5"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col z-10 relative no-scrollbar">
        {renderActiveTab()}
      </main>

      {/* Global P2P Transfers overlay drawer */}
      <TransferModal />

      {/* Footer / Info ticker bar */}
      <footer className="w-full py-3.5 px-4 md:px-8 border-t border-white/5 bg-slate-950/20 z-10 flex items-center justify-between text-[10px] text-slate-500 font-bold select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
          <span>Security status: End-to-End Cryptography Ok</span>
        </div>
        <div className="hidden xs:block">
          <span>TransLocal v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
