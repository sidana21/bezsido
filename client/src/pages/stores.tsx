import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Store, MapPin, Phone, Clock, Star } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { User, Store as StoreType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface StoreWithOwner extends StoreType {
  owner: User;
}

export default function Stores() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  const { data: stores = [], isLoading: isLoadingStores } = useQuery<StoreWithOwner[]>({
    queryKey: ["/api/stores", currentUser?.location],
    queryFn: () => apiRequest(`/api/stores?location=${encodeURIComponent(currentUser?.location || '')}`),
    enabled: !!currentUser,
  });

  const startChatMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      return apiRequest("/api/chats/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });
    },
    onSuccess: (data: any) => {
      setLocation(`/chat/${data.chatId}`);
    },
  });

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-whatsapp-green text-white p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-green-600"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">المتاجر</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Location Banner */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">المتاجر في منطقة {currentUser?.location}</span>
          </div>
          <p className="text-sm text-gray-500">اكتشف المتاجر والخدمات المحلية في منطقتك</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="ابحث عن متجر أو فئة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
            data-testid="input-search-stores"
          />
        </div>

        {/* Promote Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-4 mb-6">
          <div className="text-center">
            <Store className="w-8 h-8 mx-auto mb-2" />
            <h2 className="text-lg font-bold mb-2">أضف متجرك</h2>
            <p className="text-sm opacity-90">انضم إلى شبكة المتاجر المحلية واعرض منتجاتك للجميع</p>
            <Link href="/my-store">
              <Button
                className="mt-3 bg-white text-blue-600 hover:bg-gray-100"
                size="sm"
                data-testid="button-add-store"
              >
                سجل متجرك مجاناً
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingStores && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 animate-pulse">
                <div className="flex">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex-1 mr-4 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="flex gap-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stores Grid */}
        {!isLoadingStores && (
          <div className="space-y-4">
            {filteredStores.map((store) => (
              <div
                key={store.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
                data-testid={`store-card-${store.id}`}
              >
                <div className="flex">
                  {store.imageUrl && (
                    <img
                      src={store.imageUrl}
                      alt={store.name}
                      className="w-24 h-24 object-cover"
                      data-testid={`img-store-${store.id}`}
                    />
                  )}
                  {!store.imageUrl && (
                    <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Store className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{store.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{store.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          بواسطة {store.owner.name}
                        </p>
                      </div>
                      <Badge
                        variant={store.isOpen ? "default" : "secondary"}
                        className={store.isOpen ? "bg-green-500" : "bg-gray-500"}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {store.isOpen ? "مفتوح" : "مغلق"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{store.location}</span>
                      </div>
                      {store.phoneNumber && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{store.phoneNumber}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {store.category}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="bg-whatsapp-green hover:bg-green-600"
                        onClick={() => startChatMutation.mutate(store.userId)}
                        disabled={startChatMutation.isPending}
                        data-testid={`button-contact-${store.id}`}
                      >
                        تواصل
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        data-testid={`button-view-${store.id}`}
                      >
                        عرض المنتجات
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoadingStores && filteredStores.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? "لا توجد متاجر تطابق البحث" : "لا توجد متاجر في هذه المنطقة حالياً"}
            </p>
            {!searchQuery && (
              <p className="text-sm text-gray-400 mt-2">
                كن أول من ينشئ متجراً في منطقتك!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <Link href="/my-store">
          <Button
            className="w-16 h-16 rounded-full bg-[var(--whatsapp-primary)] hover:bg-[var(--whatsapp-primary)]/90 shadow-lg transition-transform hover:scale-110"
            data-testid="fab-my-store"
          >
            <Store className="h-6 w-6 text-white" />
          </Button>
        </Link>
      </div>
    </div>
  );
}