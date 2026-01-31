
import React from 'react';
import { PrayerName } from '../types';

interface PrayerCardProps {
  name: PrayerName;
  time: Date;
  completed: boolean;
  isNext: boolean;
  onToggle: () => void;
}

const PrayerCard: React.FC<PrayerCardProps> = ({ name, time, completed, isNext, onToggle }) => {
  const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isPast = new Date() > time;

  return (
    <div 
      className={`
        relative overflow-hidden p-4 rounded-2xl transition-all duration-300 active:scale-[0.98]
        ${completed ? 'bg-green-100 border-green-200' : isNext ? 'bg-white border-blue-200 shadow-lg' : 'bg-white border-gray-100'}
        border shadow-sm flex items-center justify-between
      `}
    >
      <div className="flex items-center gap-4">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center
          ${completed ? 'bg-green-500 text-white' : isNext ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}
        `}>
          {completed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
             <span className="text-xs font-bold uppercase">{name[0]}</span>
          )}
        </div>
        
        <div>
          <h3 className={`font-semibold text-lg ${completed ? 'text-green-800' : 'text-gray-900'}`}>
            {name}
            {isNext && !completed && <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">UP NEXT</span>}
          </h3>
          <p className={`text-sm ${completed ? 'text-green-600' : 'text-gray-500'}`}>
            {timeString}
          </p>
        </div>
      </div>

      <button
        onClick={onToggle}
        className={`
          px-4 py-2 rounded-full font-medium text-sm transition-colors
          ${completed 
            ? 'bg-transparent text-green-600 border border-green-200' 
            : 'bg-blue-500 text-white hover:bg-blue-600'}
        `}
      >
        {completed ? 'Marked' : 'Mark Done'}
      </button>
      
      {isNext && !completed && (
        <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500" />
      )}
    </div>
  );
};

export default PrayerCard;
