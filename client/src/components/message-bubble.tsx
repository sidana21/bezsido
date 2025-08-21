import { Message, User } from "@shared/schema";
import { Check, CheckCheck, Clock } from "lucide-react";

interface MessageBubbleProps {
  message: Message & { sender?: User };
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getStatusIcon = () => {
    if (!isOwn) return null;
    
    if (message.isRead) {
      return <CheckCheck className="w-3 h-3 text-blue-500" data-testid="status-read" />;
    } else if (message.isDelivered) {
      return <CheckCheck className="w-3 h-3 text-gray-400" data-testid="status-delivered" />;
    } else {
      return <Check className="w-3 h-3 text-gray-400" data-testid="status-sent" />;
    }
  };

  return (
    <div className={`mb-4 flex message-bubble ${isOwn ? 'justify-end' : ''}`}>
      <div className="max-w-xs lg:max-w-md">
        <div
          className={`rounded-lg p-3 shadow-md ${
            isOwn
              ? 'bg-[var(--whatsapp-light)] dark:bg-[var(--whatsapp-secondary)] rounded-tl-none'
              : 'bg-white dark:bg-gray-700 rounded-tr-none'
          }`}
          data-testid={`message-${message.id}`}
        >
          {message.messageType === 'image' && message.imageUrl && (
            <img
              src={message.imageUrl}
              alt="Message image"
              className="w-full rounded-lg object-cover mb-2"
              data-testid="message-image"
            />
          )}
          <p className="text-gray-800 dark:text-gray-200 break-words" data-testid="message-content">
            {message.content}
          </p>
          <div className="flex items-center justify-end mt-1 gap-1">
            {getStatusIcon()}
            <span className="text-xs text-gray-500 dark:text-gray-400" data-testid="message-time">
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
