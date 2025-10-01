import { Star, Crown } from "lucide-react";

interface VerifiedBadgeProps {
  className?: string;
  title?: string;
  animated?: boolean;
  variant?: 'default' | 'premium' | 'subtle';
  verificationType?: 'verified' | 'admin'; // نوع التوثيق: verified للمستخدم العادي، admin للمشرف
}

export function VerifiedBadge({ 
  className = "w-4 h-4", 
  title,
  animated = true,
  variant = 'default',
  verificationType
}: VerifiedBadgeProps) {
  
  // إذا تم تحديد verificationType، استخدمه لتحديد الشكل
  if (verificationType === 'admin') {
    // نجمة ذهبية متوهجة للمشرفين
    return (
      <div
        className={`relative inline-flex items-center justify-center ${className}`}
        title={title || "مشرف موثق 👑"}
        data-testid="badge-verified-admin"
      >
        {/* Multi-layer glow effect */}
        <div className="absolute inset-0 rounded-full">
          {animated && (
            <>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 opacity-60 animate-pulse"></div>
              <div className="absolute inset-[1px] rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 opacity-80 animate-ping" style={{ animationDuration: '2s' }}></div>
            </>
          )}
        </div>
        
        {/* Main star container */}
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 blur-sm opacity-70"></div>
            
            {/* Star icon with crown */}
            <Star 
              className="relative w-[80%] h-[80%] text-yellow-500 drop-shadow-lg" 
              fill="currentColor"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.8))',
              }}
            />
          </div>
        </div>
        
        {/* Sparkle effects */}
        {animated && (
          <>
            <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-amber-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </>
        )}
      </div>
    );
  }
  
  if (verificationType === 'verified') {
    // نجمة زرقاء متوهجة للمستخدمين الموثقين
    return (
      <div
        className={`relative inline-flex items-center justify-center ${className}`}
        title={title || "مستخدم موثق ⭐"}
        data-testid="badge-verified-user"
      >
        {/* Multi-layer glow effect */}
        <div className="absolute inset-0 rounded-full">
          {animated && (
            <>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 opacity-60 animate-pulse"></div>
              <div className="absolute inset-[1px] rounded-full bg-gradient-to-r from-blue-300 via-blue-400 to-blue-500 opacity-80 animate-ping" style={{ animationDuration: '2s' }}></div>
            </>
          )}
        </div>
        
        {/* Main star container */}
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 blur-sm opacity-70"></div>
            
            {/* Star icon */}
            <Star 
              className="relative w-[80%] h-[80%] text-blue-500 drop-shadow-lg" 
              fill="currentColor"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.8))',
              }}
            />
          </div>
        </div>
        
        {/* Sparkle effects */}
        {animated && (
          <>
            <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-blue-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </>
        )}
      </div>
    );
  }
  
  // Premium glowing star variant (للتوافق الرجعي)
  if (variant === 'premium') {
    return (
      <div
        className={`relative inline-flex items-center justify-center ${className}`}
        title={title}
        data-testid="badge-verified"
      >
        {/* Multi-layer glow effect */}
        <div className="absolute inset-0 rounded-full">
          {animated && (
            <>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 opacity-60 animate-pulse"></div>
              <div className="absolute inset-[1px] rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 opacity-80 animate-ping" style={{ animationDuration: '2s' }}></div>
            </>
          )}
        </div>
        
        {/* Main star container */}
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 blur-sm opacity-70"></div>
            
            {/* Star icon */}
            <Star 
              className="relative w-[80%] h-[80%] text-yellow-500 drop-shadow-lg" 
              fill="currentColor"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.8))',
              }}
            />
          </div>
        </div>
        
        {/* Sparkle effects */}
        {animated && (
          <>
            <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-amber-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </>
        )}
      </div>
    );
  }

  // Subtle variant for less prominent areas
  if (variant === 'subtle') {
    return (
      <div
        className={`relative inline-flex items-center justify-center ${className}`}
        title={title}
        data-testid="badge-verified"
      >
        <div className="relative flex items-center justify-center w-full h-full">
          <Star 
            className="w-full h-full text-blue-500 opacity-80" 
            fill="currentColor"
          />
        </div>
      </div>
    );
  }

  // Default enhanced variant
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      title={title}
      data-testid="badge-verified"
    >
      {/* Rotating gradient ring */}
      <div className={`absolute inset-0 rounded-full bg-gradient-conic from-blue-600 via-emerald-500 via-purple-600 to-blue-600 ${animated ? 'animate-spin' : ''}`} 
           style={{ animation: animated ? 'spin 4s linear infinite' : 'none' }}>
      </div>
      
      {/* Inner container */}
      <div className="relative flex items-center justify-center w-full h-full rounded-full bg-white dark:bg-gray-900 border-2 border-transparent">
        {/* Gradient border */}
        <div className="absolute inset-[1px] rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500"></div>
        
        {/* Star background */}
        <div className="relative flex items-center justify-center w-full h-full rounded-full bg-white dark:bg-gray-900 m-[1px]">
          {/* Glowing star */}
          <div className="relative">
            <Star 
              className="w-[65%] h-[65%] text-emerald-500 drop-shadow-md" 
              fill="currentColor"
              style={{
                filter: 'drop-shadow(0 0 2px rgba(16, 185, 129, 0.6))',
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Pulse effect */}
      {animated && (
        <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-25 animate-ping" style={{ animationDuration: '2.5s' }}></div>
      )}
    </div>
  );
}