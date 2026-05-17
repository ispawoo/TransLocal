'use client';

import React from 'react';
import { useAppStore, Transfer } from '../store/useAppStore';
import { webRTCManager } from '../services/webrtc';
import { Download, X, ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TransferModal: React.FC = () => {
  const { transfers } = useAppStore();
  
  // Filter active transfers (pending, connecting, transferring)
  const activeTransfers = Object.values(transfers).filter(
    (tx) => 
      tx.status === 'pending' || 
      tx.status === 'connecting' || 
      tx.status === 'transferring'
  );

  // If there are no active transfers, do not render
  if (activeTransfers.length === 0) return null;

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec: number): string => {
    if (bytesPerSec === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
    return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatETA = (seconds: number): string => {
    if (seconds <= 0) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleAccept = (tx: Transfer) => {
    if (webRTCManager) {
      webRTCManager.acceptTransfer(tx.peerId, tx.id);
    }
  };

  const handleDecline = (tx: Transfer) => {
    if (webRTCManager) {
      webRTCManager.declineTransfer(tx.peerId, tx.id);
    }
  };

  const handleCancel = (tx: Transfer) => {
    if (webRTCManager) {
      webRTCManager.cancelTransfer(tx.peerId, tx.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 bg-slate-950/20 flex items-center justify-between">
          <h3 className="font-extrabold text-sm tracking-widest text-slate-400 uppercase">
            File Transfers ({activeTransfers.length})
          </h3>
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></span>
        </div>

        {/* Transfers List */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 no-scrollbar">
          <AnimatePresence>
            {activeTransfers.map((tx) => {
              const isSending = tx.type === 'send';
              
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden"
                >
                  {/* Backdrop glowing strip for ongoing transfer */}
                  {tx.status === 'transferring' && (
                    <div 
                      className="absolute bottom-0 left-0 h-1 bg-brand-accent/40 transition-all duration-300"
                      style={{ width: `${tx.progress}%` }}
                    />
                  )}

                  {/* Transfer Details Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar Indicator */}
                      <span className="text-3xl select-none">{tx.peerAvatar}</span>
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          {isSending ? (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5 text-brand-accent" />
                              Sending to {tx.peerName}
                            </>
                          ) : (
                            <>
                              <ArrowDownLeft className="w-3.5 h-3.5 text-brand-success" />
                              Incoming from {tx.peerName}
                            </>
                          )}
                        </h4>
                        <p className="text-sm font-bold text-slate-100 mt-1 max-w-[200px] truncate">
                          {tx.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {formatSize(tx.fileSize)}
                        </p>
                      </div>
                    </div>

                    {/* Status badges */}
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      tx.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      tx.status === 'connecting' ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20 animate-pulse' :
                      'bg-brand-success/10 text-brand-success border border-brand-success/20'
                    }`}>
                      {tx.status}
                    </span>
                  </div>

                  {/* 1. Request Actions (Accept / Decline) for incoming pending */}
                  {tx.status === 'pending' && !isSending && (
                    <div className="flex gap-2.5 mt-2">
                      <button
                        onClick={() => handleDecline(tx)}
                        className="flex-1 py-2 px-3 rounded-xl border border-white/10 hover:border-white/20 text-xs font-bold text-slate-300 hover:text-white transition-all bg-white/5 active:scale-95"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAccept(tx)}
                        className="flex-1 py-2 px-3 rounded-xl bg-brand-success hover:bg-brand-success/90 text-xs font-bold text-white shadow-md shadow-brand-success/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Accept
                      </button>
                    </div>
                  )}

                  {/* 2. Sender Waiting Indicator */}
                  {tx.status === 'pending' && isSending && (
                    <div className="mt-2 text-center text-xs text-slate-400 bg-black/15 border border-white/5 py-2.5 px-3 rounded-xl animate-pulse flex items-center justify-center gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      Waiting for receiver to accept...
                    </div>
                  )}

                  {/* 3. Progress details (Connecting / Transferring) */}
                  {(tx.status === 'transferring' || tx.status === 'connecting') && (
                    <div className="flex flex-col gap-2 mt-1">
                      
                      {/* Speed / ETA info */}
                      {tx.status === 'transferring' && (
                        <div className="flex justify-between text-[11px] text-slate-400 font-bold px-0.5">
                          <span>Speed: {formatSpeed(tx.speed)}</span>
                          <span>ETA: {formatETA(tx.eta)}</span>
                        </div>
                      )}

                      {/* Bar and percentages */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-950/60 rounded-full overflow-hidden border border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${tx.progress}%` }}
                            transition={{ duration: 0.1 }}
                            className="h-full bg-gradient-to-r from-brand-accent to-indigo-500 rounded-full"
                          />
                        </div>
                        <span className="text-xs font-extrabold text-slate-200 tracking-wider w-8 text-right">
                          {tx.progress}%
                        </span>
                      </div>

                      {/* Cancel transfer Button */}
                      <button
                        onClick={() => handleCancel(tx)}
                        className="mt-1 py-1.5 text-center text-rose-400 hover:text-rose-300 font-bold text-[11px] hover:bg-rose-500/10 border border-transparent hover:border-rose-500/10 transition-all rounded-lg active:scale-95 flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Cancel Transfer
                      </button>
                    </div>
                  )}

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};
