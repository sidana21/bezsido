import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, MapPin, Star, Users, Package, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VendorCategory {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface Vendor {
  id: string;
  businessName: string;
  displayName: string;
  description: string;
  categoryId: string;
  logoUrl?: string;
  bannerUrl?: string;
  location: string;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  averageRating: string;
  totalReviews: number;
  totalProducts: number;
  createdAt: string;
  category?: VendorCategory;
  ratingsCount?: number;
}

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  // Get vendor categories
  const { data: categories = [] } = useQuery<VendorCategory[]>({
    queryKey: ['/api/vendor-categories'],
  });

  // Get vendors with filters
  const { data: allVendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ['/api/vendors', selectedLocation, selectedCategory, 'approved'],
  });

  // Get featured vendors
  const { data: featuredVendors = [] } = useQuery<Vendor[]>({
    queryKey: ['/api/vendors/featured'],
  });

  // Filter vendors based on search term
  const filteredVendors = allVendors.filter(vendor =>
    vendor.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVendorCategory = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const VendorCard = ({ vendor, featured = false }: { vendor: Vendor; featured?: boolean }) => {
    const category = getVendorCategory(vendor.categoryId);
    
    return (
      <Card 
        className={cn(
          "group hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden",
          featured && "ring-2 ring-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50"
        )}
        data-testid={`vendor-card-${vendor.id}`}
      >
        {featured && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-yellow-500 text-yellow-900 hover:bg-yellow-600">
              ⭐ مميز
            </Badge>
          </div>
        )}
        
        {vendor.bannerUrl && (
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
            <img 
              src={vendor.bannerUrl} 
              alt={vendor.displayName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
              <AvatarImage src={vendor.logoUrl} alt={vendor.displayName} />
              <AvatarFallback className="bg-blue-500 text-white font-bold">
                {vendor.displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-gray-900 truncate">
                  {vendor.displayName}
                </CardTitle>
                {vendor.isVerified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    ✓ موثق
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-gray-600 font-medium">{vendor.businessName}</p>
              
              {category && (
                <Badge 
                  variant="outline" 
                  className="mt-1 text-xs"
                  style={{ borderColor: category.color, color: category.color }}
                >
                  {category.icon} {category.nameAr}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <CardDescription className="text-sm text-gray-700 line-clamp-2">
            {vendor.description}
          </CardDescription>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{vendor.location}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              <span>{vendor.totalProducts} منتج</span>
            </div>
          </div>

          {/* Ratings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-sm">
                  {parseFloat(vendor.averageRating).toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                ({vendor.totalReviews} تقييم)
              </span>
            </div>
            
            <Link href={`/vendor/${vendor.id}`}>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
                data-testid={`button-view-vendor-${vendor.id}`}
              >
                عرض البائع
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Store className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">السوق متعدد البائعين</h1>
            <p className="text-gray-600 mt-1">اكتشف أفضل البائعين والمنتجات في منطقتك</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="ابحث عن البائعين..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-vendors"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger data-testid="select-category">
              <SelectValue placeholder="جميع الفئات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">جميع الفئات</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon} {category.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger data-testid="select-location">
              <SelectValue placeholder="جميع المناطق" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">جميع المناطق</SelectItem>
              <SelectItem value="الجزائر">الجزائر</SelectItem>
              <SelectItem value="وهران">وهران</SelectItem>
              <SelectItem value="قسنطينة">قسنطينة</SelectItem>
              <SelectItem value="عنابة">عنابة</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/my-vendor">
            <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="button-become-vendor">
              <Users className="h-4 w-4 ml-2" />
              كن بائعاً
            </Button>
          </Link>
        </div>
      </div>

      {/* Featured Vendors */}
      {featuredVendors.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900">البائعين المميزين</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVendors.slice(0, 6).map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} featured={true} />
            ))}
          </div>
        </div>
      )}

      {/* All Vendors */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">جميع البائعين</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>{filteredVendors.length} بائع</span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد بائعين</h3>
            <p className="text-gray-600 mb-4">لم نجد أي بائعين يطابقون معايير البحث</p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedLocation('');
              }}
              variant="outline"
              data-testid="button-clear-filters"
            >
              مسح الفلاتر
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">إحصائيات السوق</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{allVendors.length}</div>
            <div className="text-sm text-gray-600">بائع نشط</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{categories.length}</div>
            <div className="text-sm text-gray-600">فئة متاحة</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {allVendors.reduce((sum, vendor) => sum + vendor.totalProducts, 0)}
            </div>
            <div className="text-sm text-gray-600">منتج متاح</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {allVendors.filter(v => v.isVerified).length}
            </div>
            <div className="text-sm text-gray-600">بائع موثق</div>
          </div>
        </div>
      </div>
    </div>
  );
}