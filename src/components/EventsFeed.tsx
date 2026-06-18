// src/components/EventsFeed.tsx
'use client';

interface Event {
  id: string;
  minute: number;
  type: string;
  player: string;
  description: string;
}

interface EventsFeedProps {
  events: Event[];
  highlightedEventId?: string | null;
}

export function EventsFeed({ events, highlightedEventId }: EventsFeedProps) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200 text-center">
        <p className="text-gray-500 text-sm">No events yet</p>
        <p className="text-gray-400 text-xs mt-1">Check back for live updates</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Match Events</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {events.map((event) => {
          const isHighlighted = highlightedEventId === event.id;
          const getEventIcon = () => {
            switch(event.type) {
              case 'goal': return '⚽';
              case 'yellow_card': return '🟨';
              case 'red_card': return '🟥';
              case 'substitution': return '🔄';
              default: return '⚡';
            }
          };
          
          return (
            <div 
              key={event.id} 
              className={`flex items-start gap-3 p-2 rounded-lg transition-all duration-300 ${
                isHighlighted ? 'bg-[#f0b429]/20 border-l-4 border-[#f0b429]' : 'hover:bg-gray-50'
              }`}
            >
              <div className="relative z-10 w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center text-sm shrink-0">
                <span className="text-xs">{getEventIcon()}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-700">{event.minute}'</span>
                  <span className="text-xs text-gray-600">{event.description}</span>
                </div>
                <p className="text-[9px] text-gray-400 mt-0.5">{event.player}</p>
              </div>
              {isHighlighted && (
                <div className="animate-pulse text-[#f0b429] text-[10px] shrink-0">▶ NOW</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}