import { Plus, MessageCircle, Users, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onNewChat: () => void;
  onShowContacts: () => void;
  onNewMessage: () => void;
}

export function FloatingActionButton({ onNewChat, onShowContacts, onNewMessage }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col-reverse items-center space-y-reverse space-y-3">
      {/* Sub-buttons */}
      <div className={cn(
        "flex flex-col-reverse space-y-reverse space-y-2 transition-all duration-300 transform",
        isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95 pointer-events-none"
      )}>
        {/* New Message Button */}
        <div className="flex items-center space-x-3 space-x-reverse">
          <span className="bg-gray-800 text-white text-sm px-3 py-1 rounded-lg shadow-lg whitespace-nowrap">
            رسالة جديدة
          </span>
          <Button
            onClick={() => {
              onNewMessage();
              setIsOpen(false);
            }}
            className="w-12 h-12 rounded-full bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-primary)]/90 shadow-lg transition-transform hover:scale-110"
            data-testid="fab-new-message"
          >
            <Edit3 className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Contacts Button */}
        <div className="flex items-center space-x-3 space-x-reverse">
          <span className="bg-gray-800 text-white text-sm px-3 py-1 rounded-lg shadow-lg whitespace-nowrap">
            جهات الاتصال
          </span>
          <Button
            onClick={() => {
              onShowContacts();
              setIsOpen(false);
            }}
            className="w-12 h-12 rounded-full bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-primary)]/90 shadow-lg transition-transform hover:scale-110"
            data-testid="fab-contacts"
          >
            <Users className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="flex items-center space-x-3 space-x-reverse">
          <span className="bg-gray-800 text-white text-sm px-3 py-1 rounded-lg shadow-lg whitespace-nowrap">
            محادثة جديدة
          </span>
          <Button
            onClick={() => {
              onNewChat();
              setIsOpen(false);
            }}
            className="w-12 h-12 rounded-full bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-primary)]/90 shadow-lg transition-transform hover:scale-110"
            data-testid="fab-new-chat"
          >
            <MessageCircle className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>

      {/* Main FAB Button */}
      <Button
        onClick={toggleMenu}
        className={cn(
          "w-16 h-16 rounded-full bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-primary)]/90 shadow-lg transition-all duration-300",
          isOpen && "rotate-45"
        )}
        data-testid="main-fab"
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsOpen(false)}
          data-testid="fab-backdrop"
        />
      )}
    </div>
  );
}