'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { signalingService } from '../services/signaling';
import { webRTCManager } from '../services/webrtc';
import { Send, Copy, Clipboard, Check, Image, AlertCircle, Sparkles } from 'lucide-react';

export const SharedClipboard: React.FC = () => {
  const { peers, chatHistory } = useAppStore();
  const peersList = Object.values(peers);

  const [selectedPeerId, setSelectedPeerId] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pastePrompt, setPastePrompt] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-select first peer if available and none is selected
  useEffect(() => {
    if (peersList.length > 0 && !selectedPeerId) {
      setSelectedPeerId(peersList[0].id);
    } else if (peersList.length === 0 && selectedPeerId) {
      setSelectedPeerId('');
    }
  }, [peersList, selectedPeerId]);

  // Scroll to bottom of chat when new message arrives
  const currentChat = selectedPeerId ? chatHistory[selectedPeerId] || [] : [];
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat]);

  // Clipboard Paste listener for image paste support
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const manager = webRTCManager;
      if (!selectedPeerId || !manager) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            console.log('[Clipboard] Captured pasted image file:', file.name);
            manager.initiateSendFile(selectedPeerId, file);
            
            // Visual alert
            setPastePrompt(true);
            setTimeout(() => setPastePrompt(false), 3000);
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [selectedPeerId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedPeerId) return;

    // Send via signaling server
    signalingService.sendChatMessage(selectedPeerId, inputText.trim());
    setInputText('');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const isLink = (text: string) => {
    try {
      const url = new URL(text);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6 p-4 md:p-8 z-10">
      
      {/* Decorative background glow */}
      <div className="glow-blur-blue top-[30%] left-[40%]"></div>

      {/* Devices Sidebar Selector */}
      <div className="w-full md:w-64 flex flex-col gap-4">
        <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase text-left">
          Select Active Device
        </h3>

        <div className="glass-panel rounded-2xl p-2.5 flex flex-col gap-1 border border-white/5 bg-slate-900/40">
          {peersList.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No devices found. Discovered devices will appear here.
            </div>
          ) : (
            peersList.map((peer) => (
              <button
                key={peer.id}
                onClick={() => setSelectedPeerId(peer.id)}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-300 text-left ${
                  selectedPeerId === peer.id
                    ? 'bg-brand-accent/15 border border-brand-accent/30 text-white'
                    : 'bg-transparent border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <span className="text-2xl select-none">{peer.avatar}</span>
                <div className="truncate flex-1">
                  <p className="text-xs font-bold truncate leading-tight">
                    {peer.name}
                  </p>
                  <p className="text-[9px] text-slate-500 capitalize mt-0.5 font-semibold">
                    {peer.deviceType}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Pasteur instructions info */}
        {selectedPeerId && (
          <div className="glass-card rounded-2xl p-4 text-xs flex items-start gap-2.5 text-left border border-white/5 bg-slate-900/10">
            <Clipboard className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-300">Ctrl + V / Paste Image</p>
              <p className="text-slate-500 leading-relaxed mt-0.5">
                You can copy any image from your system and press Ctrl+V while this panel is open to send the image as a file directly to the device!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sync Chat & Clipboard Board */}
      <div className="flex-1 glass-panel rounded-3xl border border-white/5 overflow-hidden flex flex-col bg-slate-900/20 min-h-[400px]">
        {selectedPeerId ? (
          <>
            {/* Header info */}
            <div className="px-6 py-4 border-b border-white/5 bg-slate-950/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl select-none">
                  {peers[selectedPeerId]?.avatar || '👤'}
                </span>
                <div className="text-left leading-tight">
                  <h4 className="text-xs font-bold text-slate-100">
                    Sync Board with {peers[selectedPeerId]?.name}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Temporary E2E encrypted local share
                  </p>
                </div>
              </div>

              {/* Paste Image notification */}
              {pastePrompt && (
                <div className="text-[10px] bg-brand-success/10 border border-brand-success/20 text-brand-success px-2.5 py-1 rounded-full font-bold animate-bounce flex items-center gap-1">
                  <Image className="w-3 h-3" />
                  Image Sent!
                </div>
              )}
            </div>

            {/* Board Content */}
            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 no-scrollbar max-h-[350px]">
              {currentChat.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-75">
                  <Sparkles className="w-8 h-8 text-brand-accent/50 animate-pulse mb-3" />
                  <p className="text-xs font-bold text-slate-300">Sync Board is empty</p>
                  <p className="text-[11px] text-slate-500 max-w-[240px] mt-1 leading-normal">
                    Type text or paste links to sync clipboards instantly across your active devices.
                  </p>
                </div>
              ) : (
                currentChat.map((msg) => {
                  const isLinkText = isLink(msg.text);
                  const isCopied = copiedId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${
                        msg.isSelf ? 'align-self-end ml-auto' : 'mr-auto'
                      }`}
                    >
                      <div
                        className={`p-3.5 rounded-2xl relative group ${
                          msg.isSelf
                            ? 'bg-brand-accent text-white rounded-tr-none'
                            : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {/* Copy float button */}
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className={`absolute -top-2.5 -right-2.5 p-1.5 rounded-lg border bg-slate-900 border-white/5 hover:border-brand-accent/40 text-slate-400 hover:text-white transition-opacity opacity-0 group-hover:opacity-100 ${
                            isCopied ? 'opacity-100 border-brand-success' : ''
                          }`}
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-brand-success" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>

                        <div className="text-left text-xs leading-normal break-words whitespace-pre-wrap pr-4 select-text">
                          {isLinkText ? (
                            <a
                              href={msg.text}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-slate-200 break-all flex items-center gap-1 text-sky-200"
                            >
                              {msg.text}
                            </a>
                          ) : (
                            msg.text
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1 px-1 font-semibold">
                        {msg.isSelf ? 'You' : msg.peerName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Footer */}
            <form
              onSubmit={handleSend}
              className="p-4 border-t border-white/5 bg-slate-950/20 flex gap-2.5 items-center"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type text or paste links to sync..."
                className="flex-1 glass-input py-2.5 px-4 rounded-xl text-xs text-white placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="py-2.5 px-4 bg-brand-accent hover:bg-brand-accent/90 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all duration-300 shadow-md shadow-brand-accent/25 hover:shadow-brand-accent/40 active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
            <AlertCircle className="w-8 h-8 text-slate-600 mb-3" />
            <p className="text-xs font-bold text-slate-300">Sync board offline</p>
            <p className="text-[11px] text-slate-500 max-w-[260px] mt-1 leading-normal">
              Please connect and select an active device on the left to start syncing clipboard text or exchange temporary chats.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
