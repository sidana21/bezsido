import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Store, MapPin, Phone, Clock } from "lucide-react";
import { Link } from "wouter";
import type { User } from "@shared/schema";

export default function Stores() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/current"],
  });

  // Mock stores data - في التطبيق الحقيقي، ستأتي من API
  const stores = [
    {
      id: "store-1",
      name: "متجر الإلكترونيات الذكية",
      description: "أجهزة هواتف وحاسوب وإكسسوارات",
      location: "تندوف",
      phone: "+213555123456",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
      category: "إلكترونيات",
      isOpen: true,
      rating: 4.5,
      products: ["iPhone 15", "سماعات AirPods", "شاحن لاسلكي"]
    },
    {
      id: "store-2", 
      name: "بقالة العائلة",
      description: "مواد غذائية ومنظفات ومستلزمات يومية",
      location: "تندوف",
      phone: "+213555789123",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=MnwxMجA3fDB8MHhواG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
      category: "بقالة",
      isOpen: true,
      rating: 4.2,
      products: ["خضروات طازجة", "لحوم", "منتجات الألبان"]
    },
    {
      id: "store-3",
      name: "مخبز الأصالة",
      description: "خبز طازج وحلويات تقليدية",
      location: "تندوف", 
      phone: "+213555456789",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&ixid=MnwxMجA3fDB8MHhواG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
      category: "مخبز",
      isOpen: false,
      rating: 4.8,
      products: ["خبز فرنسي", "كعك", "حلويات شرقية"]
    }
  ];

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
            <Button
              className="mt-3 bg-white text-blue-600 hover:bg-gray-100"
              size="sm"
              data-testid="button-add-store"
            >
              سجل متجرك مجاناً
            </Button>
          </div>
        </div>

        {/* Stores Grid */}
        <div className="space-y-4">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
              data-testid={`store-card-${store.id}`}
            >
              <div className="flex">
                <img
                  src={store.image}
                  alt={store.name}
                  className="w-24 h-24 object-cover"
                  data-testid={`img-store-${store.id}`}
                />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{store.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{store.description}</p>
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
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{store.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>⭐ {store.rating}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {store.category}
                    </Badge>
                    {store.products.slice(0, 2).map((product, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {product}
                      </Badge>
                    ))}
                    {store.products.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{store.products.length - 2}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="bg-whatsapp-green hover:bg-green-600"
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

        {filteredStores.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? "لا توجد متاجر تطابق البحث" : "لا توجد متاجر في هذه المنطقة حالياً"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}