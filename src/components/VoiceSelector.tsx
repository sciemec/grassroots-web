// src/components/VoiceSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { Mic, ChevronDown, Volume2, Check } from 'lucide-react';

interface VoiceOption {
  name: string;
  lang: string;
  gender: 'male' | 'female';
  accent: string;
  voice: SpeechSynthesisVoice;
}

interface VoiceSelectorProps {
  onVoiceChange: (voice: SpeechSynthesisVoice) => void;
  currentVoice?: SpeechSynthesisVoice | null;
}

export function VoiceSelector({ onVoiceChange, currentVoice }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'male' | 'female'>('male');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVoices = () => {
      const synth = window.speechSynthesis;
      let available = synth.getVoices();
      
      if (available.length > 0) {
        const mapped = available.map(v => ({
          name: v.name,
          lang: v.lang,
          gender: (v.name.toLowerCase().includes('female') || 
                   v.name.toLowerCase().includes('samantha') ||
                   v.name.toLowerCase().includes('zira') ||
                   v.name.toLowerCase().includes('victoria')) ? 'female' as const : 'male' as const,
          accent: v.lang.includes('US') ? 'American' : 
                  v.lang.includes('GB') ? 'British' :
                  v.lang.includes('AU') ? 'Australian' :
                  v.lang.includes('ZA') ? 'South African' :
                  v.lang.includes('IN') ? 'Indian' : 'Other',
          voice: v
        }));
        setVoices(mapped);
        setIsLoading(false);
        
        // Set default voice if none selected
        if (!selectedVoice && mapped.length > 0) {
          const defaultVoice = mapped.find(v => v.gender === 'male' && v.accent === 'British') || mapped[0];
          setSelectedVoice(defaultVoice);
          onVoiceChange(defaultVoice.voice);
        }
      } else {
        setTimeout(loadVoices, 100);
      }
    };
    
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const filteredVoices = voices.filter(v => v.gender === activeTab);
  const maleCount = voices.filter(v => v.gender === 'male').length;
  const femaleCount = voices.filter(v => v.gender === 'female').length;

  const handleSelect = (voice: VoiceOption) => {
    setSelectedVoice(voice);
    onVoiceChange(voice.voice);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 transition"
      >
        <Mic size={12} />
        {isLoading ? (
          <span className="text-gray-400">Loading voices...</span>
        ) : selectedVoice ? (
          <span>{selectedVoice.gender === 'male' ? '👨' : '👩'} {selectedVoice.name} ({selectedVoice.accent})</span>
        ) : (
          'Select Voice'
        )}
        <ChevronDown size={10} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h4 className="text-xs font-bold text-gray-700">Choose Commentator Voice</h4>
          </div>
          
          {/* Gender tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('male')}
              className={`flex-1 py-2.5 text-xs font-medium transition ${
                activeTab === 'male' ? 'bg-[#1a5c2a] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              👨 Male ({maleCount})
            </button>
            <button
              onClick={() => setActiveTab('female')}
              className={`flex-1 py-2.5 text-xs font-medium transition ${
                activeTab === 'female' ? 'bg-[#1a5c2a] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              👩 Female ({femaleCount})
            </button>
          </div>
          
          {/* Voice list */}
          <div className="max-h-64 overflow-y-auto">
            {filteredVoices.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                No {activeTab} voices available on this device
              </div>
            ) : (
              filteredVoices.map((voice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(voice)}
                  className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 transition flex items-center justify-between border-b border-gray-50 ${
                    selectedVoice?.name === voice.name ? 'bg-green-50' : ''
                  }`}
                >
                  <div>
                    <span className="font-medium text-gray-800">{voice.name}</span>
                    <span className="text-[9px] text-gray-400 ml-2">({voice.accent})</span>
                  </div>
                  {selectedVoice?.name === voice.name && <Check size={12} className="text-[#1a5c2a]" />}
                </button>
              ))
            )}
          </div>
          
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-[9px] text-gray-400 text-center">
            {filteredVoices.length} voices available
          </div>
        </div>
      )}
    </div>
  );
}