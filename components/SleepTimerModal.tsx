import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ClockIcon } from './Icons';

interface SleepTimerModalProps {
  onClose: () => void;
  onSetTimer: (durationMinutes: number) => void;
  onClearTimer: () => void;
  activeTimerEndsAt?: number;
}

const DURATIONS = [15, 30, 45, 60];

const SleepTimerModal: React.FC<SleepTimerModalProps> = ({ onClose, onSetTimer, onClearTimer, activeTimerEndsAt }) => {
  const [remainingTime, setRemainingTime] = useState('');

  useEffect(() => {
    if (activeTimerEndsAt) {
      const updateRemainingTime = () => {
        const remainingSeconds = Math.max(0, Math.round((activeTimerEndsAt - Date.now()) / 1000));
        if (remainingSeconds <= 0) {
          setRemainingTime('');
          onClose(); // Close modal when timer finishes
        } else {
          const minutes = Math.floor(remainingSeconds / 60);
          const seconds = remainingSeconds % 60;
          setRemainingTime(`${minutes}m ${String(seconds).padStart(2, '0')}s remaining`);
        }
      };
      updateRemainingTime();
      const interval = setInterval(updateRemainingTime, 1000);
      return () => clearInterval(interval);
    } else {
      setRemainingTime('');
    }
  }, [activeTimerEndsAt, onClose]);

  return (
    <Modal onClose={onClose} title="Set Sleep Timer">
      <div className="flex flex-col items-center gap-6">
        <ClockIcon className="w-16 h-16 text-indigo-400" />
        {activeTimerEndsAt ? (
          <div className="text-center">
            <p className="text-2xl font-semibold text-white">{remainingTime}</p>
            <p className="text-gray-400">Audio will pause when the timer ends.</p>
          </div>
        ) : (
          <p className="text-lg text-gray-300">Choose a duration to automatically pause playback.</p>
        )}
        
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3">
          {DURATIONS.map(duration => (
            <button
              key={duration}
              onClick={() => { onSetTimer(duration); onClose(); }}
              className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors active:scale-95"
            >
              <span className="text-lg font-semibold">{duration}</span>
              <span className="text-sm text-gray-400"> min</span>
            </button>
          ))}
        </div>

        {activeTimerEndsAt && (
          <button
            onClick={() => { onClearTimer(); onClose(); }}
            className="w-full max-w-xs px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition-colors active:scale-95"
          >
            Cancel Timer
          </button>
        )}
      </div>
    </Modal>
  );
};

export default SleepTimerModal;