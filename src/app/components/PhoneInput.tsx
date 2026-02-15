'use client';

import { useState, useEffect, useRef } from 'react';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string | null;
  onChange: (value: string) => void;
}

export default function PhoneInput({ value, onChange, className, placeholder, ...props }: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper: Format to (XXX) XXX-XXXX
  const formatPhone = (input: string) => {
    // Only numbers
    const digits = input.replace(/\D/g, '');
    
    // Limit to 10 digits (Standard COL)
    const cleaned = digits.slice(0, 10);
    
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return `(${cleaned}`;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // Sync with external value
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
        setDisplayValue(formatPhone(value || ''));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digits = rawVal.replace(/\D/g, '').slice(0, 10);
    
    const formatted = formatPhone(digits);
    setDisplayValue(formatted);
    
    // Emit cleaned value (only digits)
    onChange(digits);
  };

  return (
    <div className="relative w-full">
      <input
        {...props}
        ref={inputRef}
        type="tel"
        className={`${className} font-mono`}
        placeholder={placeholder || "(300) 000-0000"}
        value={displayValue}
        onChange={handleChange}
      />
    </div>
  );
}
