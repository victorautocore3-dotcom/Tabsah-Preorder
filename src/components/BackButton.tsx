import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { RouteView } from '../utils/hashRouter';

interface BackButtonProps {
  fallback: RouteView;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  fallback,
  label = 'Back',
  className = '',
}) => {
  const { goBack } = useStore();

  return (
    <button
      type="button"
      onClick={() => goBack(fallback)}
      className={`inline-flex items-center gap-2 py-1.5 text-[13px] tracking-[0.14em] uppercase font-semibold text-[#52005C] hover:text-[#E8005F] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8005F] ${className}`}
    >
      <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
};
