import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { ChatArea } from "@/components/chat-area";
import { FloatingActionButton } from "@/components/floating-action-button";
import { ContactsModal } from "@/components/contacts-modal";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Chat() {
  const [, params] = useRoute("/chat/:chatId");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    params?.chatId || "chat-sarah"
  );
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showContacts, setShowContacts] = useState(false);
  const isMobile = useIsMobile();

  // Update selected chat when URL changes
  useEffect(() => {
    if (params?.chatId) {
      setSelectedChatId(params.chatId);
      if (isMobile) {
        setSidebarVisible(false);
      }
    }
  }, [params?.chatId, isMobile]);

  const handleToggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setSidebarVisible(false);
    }
  };

  const handleShowContacts = () => {
    setShowContacts(true);
  };

  const handleNewChat = () => {
    setSidebarVisible(true);
  };

  const handleNewMessage = () => {
    setSidebarVisible(true);
  };

  return (
    <div className="flex h-[100dvh] w-full bg-white dark:bg-gray-800 pb-20">
      {/* Mobile overlay */}
      {isMobile && sidebarVisible && selectedChatId && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleToggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${
        isMobile 
          ? sidebarVisible 
            ? 'fixed inset-y-0 right-0 z-50 w-full h-[100dvh]'
            : 'hidden'
          : sidebarVisible 
            ? 'block'
            : 'hidden'
      }`}>
        <Sidebar
          selectedChatId={selectedChatId}
          onChatSelect={handleChatSelect}
          isVisible={true}
          onToggle={handleToggleSidebar}
        />
      </div>

      {/* Chat Area */}
      <div className={`flex-1 ${
        isMobile && sidebarVisible ? 'hidden' : 'flex'
      }`}>
        <ChatArea
          chatId={selectedChatId}
          onToggleSidebar={handleToggleSidebar}
        />
      </div>

      {/* Floating Action Button */}
      {!sidebarVisible && (
        <FloatingActionButton
          onNewChat={handleNewChat}
          onShowContacts={handleShowContacts}
          onNewMessage={handleNewMessage}
        />
      )}

      {/* Contacts Modal */}
      <ContactsModal
        isOpen={showContacts}
        onClose={() => setShowContacts(false)}
        onStartChat={(chatId) => {
          handleChatSelect(chatId);
          setShowContacts(false);
        }}
      />
    </div>
  );
}
