import React, { useState, useRef, useEffect } from 'react';
import { createChatSession } from '../services/gemini';
import { ChatMessage } from '../types';
import { soundEffects } from '../services/sound';
import { GenerateContentResponse } from '@google/genai';
import ReactMarkdown from 'react-markdown';

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "System Online. I am the portfolio assistant. How can I help you navigate Sidhaarth's engineering background?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSession = useRef<any>(null);

  // Initialize chat session
  useEffect(() => {
    // Delay enabling transitions to prevent "start open then close" visual glitch on load
    const timer = setTimeout(() => {
        setIsMounted(true);
    }, 500);
    
    if (!chatSession.current) {
      chatSession.current = createChatSession();
    }
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    soundEffects.playClick();
    setIsOpen(!isOpen);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    soundEffects.playMessageSent();
    const userMsg = input;
    setInput('');
    
    setMessages(prev => [
      ...prev, 
      { role: 'user', text: userMsg },
      { role: 'model', text: '' }
    ]);
    setIsLoading(true);

    try {
      if (!chatSession.current) {
        chatSession.current = createChatSession();
      }
      
      const result = await chatSession.current.sendMessageStream({ message: userMsg });
      soundEffects.playMessageReceived();

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const text = c.text || '';
        
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === 'model') {
            lastMsg.text += text;
          }
          return newMessages;
        });
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg.role === 'model' && lastMsg.text === '') {
           lastMsg.text = "Connection Error. Please retry.";
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end pointer-events-none font-sans">
      
      {/* Chat Window */}
      <div 
        className={`
          pointer-events-auto
          w-[calc(100vw-2rem)] md:w-96 h-[450px] md:h-[500px] 
          bg-black/95 border border-mono-border rounded-lg shadow-2xl 
          flex flex-col overflow-hidden mb-4 
          origin-bottom-right
          ${isMounted ? 'transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]' : ''}
          ${isOpen 
            ? 'opacity-100 scale-100 translate-y-0 visible' 
            : 'opacity-0 scale-75 translate-y-10 invisible'}
        `}
      >
        {/* Header */}
        <div className="bg-mono-paper p-4 border-b border-mono-border flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white animate-pulse"></div>
            <span className="font-mono text-xs uppercase tracking-widest text-white">Assistant V1.0</span>
          </div>
          <button onClick={toggleChat} className="text-gray-500 hover:text-white transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 text-sm border ${
                msg.role === 'user' 
                  ? 'bg-white text-black border-white' 
                  : 'bg-black text-gray-300 border-mono-border'
              }`}>
                {msg.role === 'model' ? (
                   <div className="markdown-content">
                     <ReactMarkdown
                       components={{
                         p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                         ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
                         ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2 space-y-1" {...props} />,
                         li: ({node, ...props}) => <li className="pl-1" {...props} />,
                         strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                         a: ({node, ...props}) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                         code: ({node, ...props}) => <code className="bg-gray-800 px-1 py-0.5 rounded text-xs font-mono" {...props} />
                       }}
                     >
                       {msg.text}
                     </ReactMarkdown>
                   </div>
                ) : (
                   msg.text
                )}
                
                {/* Typing Indicator */}
                {isLoading && idx === messages.length - 1 && msg.role === 'model' && !msg.text && (
                  <span className={`inline-flex gap-1 items-center h-4 align-middle`}>
                    <span className="w-1.5 h-1.5 bg-white animate-pulse"></span>
                    <span className="w-1.5 h-1.5 bg-gray-500 animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-white animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-mono-border bg-mono-paper">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Input query..."
              className="w-full bg-black border border-mono-border py-3 pl-4 pr-10 text-base md:text-sm text-white focus:outline-none focus:border-white transition-colors font-mono"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleChat}
        className="pointer-events-auto group relative w-14 h-14 bg-black border border-white hover:bg-white transition-all duration-300 flex items-center justify-center"
      >
        <div className="group-hover:invert transition-all duration-300">
            {isOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-7 h-7">
                    <rect x="4" y="8" width="16" height="12" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 8V6a4 4 0 0 1 8 0v2" />
                    <circle cx="9" cy="14" r="1" fill="currentColor" />
                    <circle cx="15" cy="14" r="1" fill="currentColor" />
                    <path d="M10 17h4" strokeLinecap="round" />
                </svg>
            )}
        </div>
      </button>
    </div>
  );
};