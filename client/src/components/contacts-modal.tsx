import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Phone, MessageSquare, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Contact {
  id: string;
  userId: string;
  contactUserId: string | null;
  phoneNumber: string;
  name: string;
  isAppUser: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatar: string | null;
    isOnline: boolean;
    location: string;
  };
}

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (userId: string) => void;
}

export function ContactsModal({ isOpen, onClose, onStartChat }: ContactsModalProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
    enabled: isOpen,
  });

  const addContactMutation = useMutation({
    mutationFn: async (contactData: { name: string; phoneNumber: string }) => {
      return apiRequest('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setNewContactName("");
      setNewContactPhone("");
      setShowAddContact(false);
      toast({
        title: "تم إضافة جهة الاتصال",
        description: "تم إضافة جهة الاتصال بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة جهة الاتصال",
        variant: "destructive",
      });
    },
  });

  const startChatMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      return apiRequest('/api/chats/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      onStartChat(data.chatId);
      onClose();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في بدء المحادثة",
        variant: "destructive",
      });
    },
  });

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phoneNumber.includes(searchTerm)
  );

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    addContactMutation.mutate({
      name: newContactName.trim(),
      phoneNumber: newContactPhone.trim(),
    });
  };

  const handleStartChat = (contact: Contact) => {
    if (contact.user?.id) {
      startChatMutation.mutate(contact.user.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>جهات الاتصال</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAddContact(!showAddContact)}
              data-testid="button-add-contact"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Add Contact Form */}
        {showAddContact && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Input
              placeholder="اسم جهة الاتصال"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              data-testid="input-contact-name"
            />
            <Input
              placeholder="رقم الهاتف"
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
              data-testid="input-contact-phone"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddContact}
                disabled={addContactMutation.isPending}
                className="flex-1"
                data-testid="button-save-contact"
              >
                {addContactMutation.isPending ? "جارِ الإضافة..." : "إضافة"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddContact(false)}
                data-testid="button-cancel-add"
              >
                إلغاء
              </Button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="البحث في جهات الاتصال"
            className="pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-contacts"
          />
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center p-4 text-gray-500 dark:text-gray-400">
              جاري التحميل...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center p-4 text-gray-500 dark:text-gray-400">
              {searchTerm ? "لا توجد جهات اتصال مطابقة" : "لا توجد جهات اتصال"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                  data-testid={`contact-item-${contact.id}`}
                >
                  <div className="flex items-center space-x-3 space-x-reverse flex-1">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={contact.user?.avatar || undefined}
                        alt={contact.name}
                      />
                      <AvatarFallback>{contact.name[0]}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {contact.name}
                        </h3>
                        {contact.isAppUser && (
                          <Badge className="bg-[var(--whatsapp-primary)] text-white text-xs">
                            في التطبيق
                          </Badge>
                        )}
                        {contact.user?.isOnline && contact.isAppUser && (
                          <span className="w-2 h-2 bg-[var(--whatsapp-online)] rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {contact.phoneNumber}
                      </p>
                      {contact.user?.location && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {contact.user.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(`tel:${contact.phoneNumber}`, '_self')}
                      data-testid="button-call-contact"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    {contact.isAppUser && contact.user && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStartChat(contact)}
                        disabled={startChatMutation.isPending}
                        data-testid="button-message-contact"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}