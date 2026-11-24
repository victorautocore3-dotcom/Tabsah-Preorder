import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const ROTATION_MS = 5500;

export const AnnouncementBar: React.FC = () => {
  const { settings } = useStore();
  const [index, setIndex] = useState(0);
  const [timerSeed, setTimerSeed] = useState(0);

  const optionsLabel = settings.upfrontOptions.map((pct) => `${pct}%`).join(', ');
  const messages = [
    `November and December 2026 Pre-Orders are open. Pay ${optionsLabel} upfront at checkout.`,
    'Every order is inspected in Lagos before your balance is due.',
    'Track your order in your dashboard, and pay any remaining balance when it arrives.',
  ];

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, ROTATION_MS);
    return () => window.clearInterval(id);
  }, [messages.length, timerSeed]);

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + messages.length) % messages.length);
    setTimerSeed((s) => s + 1);
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % messages.length);
    setTimerSeed((s) => s + 1);
  };

  return (
    <div
      role="region"
      aria-label="Store announcements"
      className="w-full max-w-full bg-[#E8005F] text-white border-b border-[#C4004F]"
    >
      <div className="max-w-[1380px] mx-auto px-2 sm:px-8 lg:px-12 py-2.5 flex items-center justify-between gap-1.5 sm:gap-3">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous announcement"
          className="w-7 h-7 flex items-center justify-center text-white/85 hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 stroke-[1.75]" />
        </button>

        <div className="flex-1 min-w-0 grid grid-cols-1 grid-rows-1 items-center">
          {messages.map((msg, i) => {
            const active = i === index;
            return (
              <p
                key={msg}
                aria-hidden={!active}
                className={`col-start-1 row-start-1 text-center text-[13px] sm:text-sm font-medium tracking-[0.02em] sm:tracking-[0.03em] leading-snug px-1 sm:px-2 text-white break-words transition-opacity duration-500 ${
                  active ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {msg}
              </p>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next announcement"
          className="w-7 h-7 flex items-center justify-center text-white/85 hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 stroke-[1.75]" />
        </button>
      </div>
    </div>
  );
};
