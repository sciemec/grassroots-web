'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Crown, MessageCircle, X } from 'lucide-react';
import { useClassroom } from './ClassroomProvider';

export function ClassroomChat() {
  const { state, sendMessage, isTeacher } = useClassroom();
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessage(message.trim());
    setMessage('');
  };

  if (!state.isActive) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 text-center">
        <MessageCircle size={20} className="mx-auto text-gray-300 mb-2" />
        <p className="text-xs text-gray-400">Join the classroom to chat</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div 
        className="px-3 py-2 bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] text-white flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={14} />
          <span className="text-xs font-bold">Classroom Chat</span>
          <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded-full">
            {state.students.length} online
          </span>
        </div>
        <span className="text-[10px]">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <>
          {/* Messages */}
          <div className="h-48 overflow-y-auto p-2 space-y-1.5 bg-gray-50">
            {state.messages.length === 0 ? (
              <div className="text-center text-[10px] text-gray-400 py-8">
                No messages yet. Start the discussion!
              </div>
            ) : (
              state.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 text-xs ${
                    msg.isTeacher ? 'bg-amber-50 border-l-2 border-amber-400' : ''
                  } p-1.5 rounded`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {msg.isTeacher ? (
                      <Crown size={12} className="text-amber-500" />
                    ) : (
                      <User size={12} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-[10px] ${
                        msg.isTeacher ? 'text-amber-700' : 'text-gray-700'
                      }`}>
                        {msg.userName}
                      </span>
                      {msg.isTeacher && (
                        <span className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded-full">
                          Coach
                        </span>
                      )}
                      <span className="text-[8px] text-gray-400 ml-auto">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-600 break-words">{msg.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-2 border-t border-gray-100 flex gap-1">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isTeacher ? "Send coaching tip..." : "Ask a question..."}
              className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a5c2a]"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="px-2.5 py-1 bg-[#1a5c2a] text-white rounded-lg hover:bg-[#0d3d1a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={12} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}