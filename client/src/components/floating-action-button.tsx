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
    <div className="fixed bottom-20 left-4 z-50 flex flex-col-reverse items-center space-y-reverse space-y-4">
      {/* Sub-buttons - Mobile optimized */}
      <div className={cn(
        "flex flex-col-reverse space-y-reverse space-y-4 transition-all duration-300 transform",
        isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95 pointer-events-none"
      )}>
        {/* New Message Button */}
        <Button
          onClick={() => {
            onNewMessage();
            setIsOpen(false);
          }}
          className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 shadow-xl transition-transform active:scale-95 touch-none"
          data-testid="fab-new-message"
        >
          <Edit3 className="h-5 w-5 text-white" />
        </Button>

        {/* Contacts Button */}
        <Button
          onClick={() => {
            onShowContacts();
            setIsOpen(false);
          }}
          className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 shadow-xl transition-transform active:scale-95 touch-none"
          data-testid="fab-contacts"
        >
          <Users className="h-5 w-5 text-white" />
        </Button>

        {/* New Chat Button */}
        <Button
          onClick={() => {
            onNewChat();
            setIsOpen(false);
          }}
          className="w-14 h-14 rounded-full bg-purple-500 hover:bg-purple-600 active:bg-purple-700 shadow-xl transition-transform active:scale-95 touch-none"
          data-testid="fab-new-chat"
        >
          <MessageCircle className="h-5 w-5 text-white" />
        </Button>
      </div>

      {/* Main FAB Button - Mobile optimized */}
      <Button
        onClick={toggleMenu}
        className={cn(
          "w-16 h-16 rounded-full bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-primary)]/90 active:bg-[var(--whatsapp-primary)]/80 shadow-xl transition-all duration-300 active:scale-95 touch-none",
          isOpen && "rotate-45"
        )}
        data-testid="main-fab"
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 -z-10"
          onClick={() => setIsOpen(false)}
          data-testid="fab-backdrop"
        />
      )}
    </div>
  );
}