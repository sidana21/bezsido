import { CheckCircle } from "lucide-react";

interface VerifiedBadgeProps {
  className?: string;
  title?: string;
  animated?: boolean;
}

export function VerifiedBadge({ className = "w-4 h-4", title = "حساب موثق", animated = true }: VerifiedBadgeProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      title={title}
      data-testid="badge-verified"
    >
      {/* Animated Gradient Background Ring */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 ${animated ? 'animate-spin' : ''}`} 
           style={{ animation: animated ? 'spin 3s linear infinite' : 'none' }}>
      </div>
      
      {/* Inner circle with verification icon */}
      <div className="relative flex items-center justify-center w-full h-full rounded-full bg-white dark:bg-gray-900 border-2 border-transparent">
        <div className="absolute inset-[1px] rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
        <div className="relative flex items-center justify-center w-full h-full rounded-full bg-white dark:bg-gray-900 m-[1px]">
          <CheckCircle 
            className="w-[60%] h-[60%] text-blue-500" 
            fill="currentColor"
          />
        </div>
      </div>
      
      {/* Pulse effect */}
      {animated && (
        <div className="absolute inset-0 rounded-full bg-blue-500 opacity-30 animate-ping"></div>
      )}
    </div>
  );
}