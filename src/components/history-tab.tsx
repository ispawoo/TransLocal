'use client';

import React from 'react';
import { useAppStore, Transfer } from '../store/useAppStore';
import { Download, CheckCircle, XCircle, Trash2, ArrowUpRight, ArrowDownLeft, FileText, Image as ImageIcon, Video, Play, ExternalLink } from 'lucide-react';

export const HistoryTab: React.FC = () => {
  const { transfers } = useAppStore();
  const allTransfers = Object.values(transfers).sort((a, b) => b.timestamp - a.timestamp);
  
  // Keep only historical items (completed, failed, declined, cancelled)
  const historyItems = allTransfers.filter(
    (tx) => 
      tx.status === 'completed' || 
      tx.status === 'failed' || 
      tx.status === 'declined' || 
      tx.status === 'cancelled'
  );

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec: number): string => {
    if (bytesPerSec === 0) return '';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
    return 'Avg: ' + parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearHistory = () => {
    // Clear all completed/inactive transfers from the store
    const store = useAppStore.getState();
    const activeKeys = Object.entries(transfers)
      .filter(([_, tx]) => tx.status === 'pending' || tx.status === 'transferring' || tx.status === 'connecting')
      .map(([id]) => id);
      
    const activeTransfers: Record<string, Transfer> = {};
    activeKeys.forEach((key) => {
      activeTransfers[key] = transfers[key];
    });
    
    useAppStore.setState({ transfers: activeTransfers });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-indigo-400" />;
    if (fileType.startsWith('video/')) return <Video className="w-5 h-5 text-pink-400" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col p-4 md:p-8 z-10">
      
      {/* Decorative glow */}
      <div className="glow-blur-emerald bottom-[20%] left-[25%]"></div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white leading-tight">
            Transfer History
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of active and finished transfers on this device
          </p>
        </div>
        
        {historyItems.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 text-xs font-bold text-slate-400 hover:text-rose-400 transition-all duration-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Log
          </button>
        )}
      </div>

      {historyItems.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px] border border-white/5 bg-slate-900/15">
          <div className="w-16 h-16 rounded-full bg-slate-950/40 border border-white/5 flex items-center justify-center text-2xl mb-4">
            📦
          </div>
          <h3 className="font-bold text-slate-300 text-sm mb-1">
            No transfers recorded
          </h3>
          <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed">
            Your successfully sent or received files will appear here, allowing easy redownload and instant previews.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
          {historyItems.map((tx) => {
            const isCompleted = tx.status === 'completed';
            const isSending = tx.type === 'send';
            const isImage = tx.fileType.startsWith('image/') && tx.previewUrl;
            const isVideo = tx.fileType.startsWith('video/') && tx.previewUrl;

            return (
              <div
                key={tx.id}
                className="glass-card rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/10 relative overflow-hidden"
              >
                {/* Left side details */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-center shrink-0">
                    {getFileIcon(tx.fileType)}
                  </div>
                  
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        {isSending ? (
                          <>
                            <ArrowUpRight className="w-3 h-3 text-brand-accent" />
                            Sent to {tx.peerName}
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft className="w-3 h-3 text-brand-success" />
                            Received from {tx.peerName}
                          </>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-600 font-semibold">•</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-200 mt-1 max-w-[260px] truncate">
                      {tx.fileName}
                    </h4>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {formatSize(tx.fileSize)}
                      </span>
                      {tx.speed > 0 && isCompleted && (
                        <>
                          <span className="text-[10px] text-slate-600 font-semibold">•</span>
                          <span className="text-[10px] text-slate-500">
                            {formatSpeed(tx.speed)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side Actions & Previews */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  
                  {/* Image/Video Preview Panel (Wow effect) */}
                  {(isImage || isVideo) && isCompleted && (
                    <div className="relative group rounded-lg overflow-hidden border border-white/10 w-16 h-10 shrink-0 bg-black/40">
                      {isImage && (
                        <img 
                          src={tx.previewUrl} 
                          alt="preview" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      )}
                      {isVideo && (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-950/20">
                          <Play className="w-3.5 h-3.5 text-white/80" />
                        </div>
                      )}
                      
                      {/* External popout preview link */}
                      <a 
                        href={tx.previewUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Actions based on Status */}
                  <div className="flex items-center gap-2">
                    {tx.status === 'completed' ? (
                      <>
                        <span className="flex items-center gap-1 text-[#10B981] text-xs font-bold bg-[#10B981]/10 px-2.5 py-1 rounded-lg border border-[#10B981]/15">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Success
                        </span>
                        
                        {!isSending && tx.previewUrl && (
                          <a
                            href={tx.previewUrl}
                            download={tx.fileName}
                            className="p-1.5 rounded-lg border border-white/10 hover:border-brand-accent/50 bg-white/5 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                            title="Save File again"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-500 text-xs font-bold bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/15">
                        <XCircle className="w-3.5 h-3.5" />
                        {tx.status === 'declined' ? 'Declined' : tx.status === 'cancelled' ? 'Cancelled' : 'Failed'}
                      </span>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
