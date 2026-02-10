import { Info } from 'lucide-react';
import { useState } from 'react';

export default function Tooltip({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block ml-1">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help text-gray-400 hover:text-blue-500 transition-colors"
      >
        <Info size={14} />
      </div>
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-[100] pointer-events-none leading-relaxed">
          {text}
          <div className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
