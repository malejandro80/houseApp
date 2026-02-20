'use client';

import { useState, useEffect, useRef } from 'react';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | undefined | null | '';
  onChange: (value: number | undefined) => void;
}

export default function NumberInput({ value, onChange, className, placeholder, ...props }: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper: Format number to es-CO string (1.000.000,00)
  const formatNumber = (num: number | string | undefined | null) => {
    if (num === '' || num === undefined || num === null) return '';
    // Check if it has decimal part?
    // Using Intl.NumberFormat for thousands separator
    // We want to preserve checking if user is typing...
    
    // Simple approach: Custom formatting
    const str = num.toString();
    // Split integer and decimal
    const parts = str.split('.'); 
    // Format integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    // Join with comma for decimal if it was a dot in JS number string
    return parts.join(',');
  };

  // Helper: Parse display string to number
  const parseNumber = (str: string) => {
    // Remove dots (thousands)
    let cleanStr = str.replace(/\./g, '');
    // Replace comma with dot (decimal)
    cleanStr = cleanStr.replace(',', '.');
    
    const num = parseFloat(cleanStr);
    return isNaN(num) ? undefined : num;
  };

  // Sync with external value
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
         setDisplayValue(formatNumber(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawVal = e.target.value;
    
    // Allow digits, dots, commas
    // Remove invalid chars?
    rawVal = rawVal.replace(/[^0-9.,]/g, '');
    
    // Prevent multiple commas
    const commaCount = (rawVal.match(/,/g) || []).length;
    if (commaCount > 1) return;
    
    // Handle deleting everything
    if (rawVal === '') {
        setDisplayValue('');
        onChange(undefined);
        return;
    }

    // Real-time formatting as checking logic is hard. 
    // Simply allow user to type, but remove thousands dots to parse.
    const numericString = rawVal.replace(/\./g, ''); // 1000,50
    // Re-format integer part if we want dynamic dots while typing?
    // It's tricky with cursor position.
    // Let's just update displayValue raw for now to allow smooth typing, 
    // and format on blur? Or try to keep dots?
    // Keeping dots while typing requires cursor management. 
    // I will try to keep dots simple:
    
    // Logic: Remove all dots, format integer part again.
    let [integer, decimal] = numericString.split(',');
    integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    let formatted = integer;
    if (decimal !== undefined) {
        formatted += ',' + decimal;
    } else if (rawVal.includes(',')) {
        formatted += ',';
    }

    setDisplayValue(formatted);
    
    // Emit parsed value
    onChange(parseNumber(formatted));
  };

  return (
    <input
        {...props}
        ref={inputRef}
        type="text"
        className={className}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
    />
  );
}
