import { Loader2 } from "lucide-react";

interface SpinnerProps {
  className?: string;
  size?: number; 
}

export function Spinner({ className = "text-blue-600", size = 24 }: SpinnerProps) {
  return (
    <Loader2 
      className={`animate-spin ${className}`} 
      size={size}
    />
  );
}
