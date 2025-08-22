import { Message, User } from "@shared/schema";
import { Check, CheckCheck, Clock, Reply, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface MessageBubbleProps {
  message: Message & { sender?: User; replyTo?: Message & { sender?: User } };
  isOwn: boolean;
  onReply?: (message: Message & { sender?: User }) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
}

export function MessageBubble({ message, isOwn, onReply, onEdit, onDelete }: MessageBubbleProps) {
  const formatTime = (date: Date | null) => {
    if (!date) return "";
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
    <div className={`mb-4 flex message-bubble group ${isOwn ? 'justify-end' : ''}`}>
      <div className="max-w-xs lg:max-w-md relative">
        <div
          className={`rounded-lg p-3 shadow-md ${
            isOwn
              ? 'bg-[var(--whatsapp-light)] dark:bg-[var(--whatsapp-secondary)] rounded-tl-none'
              : 'bg-white dark:bg-gray-700 rounded-tr-none'
          }`}
          data-testid={`message-${message.id}`}
        >
          {/* Reply preview */}
          {message.replyTo && (
            <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-600 rounded border-l-4 border-[var(--whatsapp-primary)]">
              <div className="text-xs font-medium text-[var(--whatsapp-primary)] mb-1">
                {message.replyTo.sender?.name || "رسالة محذوفة"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {message.replyTo.content}
              </div>
            </div>
          )}

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
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-xs text-gray-500 dark:text-gray-400" data-testid="message-time">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        </div>

        {/* Message actions */}
        <div className="absolute top-0 left-0 -ml-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {onReply && (
                <DropdownMenuItem onClick={() => onReply(message)}>
                  <Reply className="h-4 w-4 ml-2" />
                  رد
                </DropdownMenuItem>
              )}
              {isOwn && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(message)}>
                  تحرير
                </DropdownMenuItem>
              )}
              {isOwn && onDelete && (
                <DropdownMenuItem onClick={() => onDelete(message.id)} className="text-red-600">
                  حذف
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
