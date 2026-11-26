import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  className?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  className = 'w-full h-11 pl-3.5 pr-12 border border-[#F0D9E3] text-base text-[#222222] focus:border-[#E8005F] focus:outline-none',
  ...inputProps
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        className={className}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className={`absolute inset-y-0 right-0 w-11 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#E8005F] focus-visible:text-[#E8005F] ${
          visible ? 'text-[#E8005F]' : 'text-[#666666] hover:text-[#E8005F]'
        }`}
      >
        {visible ? (
          <EyeOff className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Eye className="w-5 h-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
};
