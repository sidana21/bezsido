import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { ChatArea } from "@/components/chat-area";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Chat() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>("chat-sarah");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const isMobile = useIsMobile();

  const handleToggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setSidebarVisible(false);
    }
  };

  return (
    <div className="flex h-screen max-w-7xl mx-auto bg-white dark:bg-gray-800 shadow-2xl pb-16">
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
            ? 'fixed inset-y-0 right-0 z-50 w-full'
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
    </div>
  );
}
