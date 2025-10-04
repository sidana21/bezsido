import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNavigation } from "@/components/bottom-navigation";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { FeaturesProvider } from "@/hooks/use-features";
import { useNotifications } from "@/hooks/use-notifications";
import { Component, ErrorInfo, ReactNode } from "react";
import Chat from "@/pages/chat";
import Status from "@/pages/status";
import Calls from "@/pages/calls";
import Vendors from "@/pages/vendors";
import Stores from "@/pages/stores";
import ProductDetail from "@/pages/product-detail";
import MyVendor from "@/pages/my-vendor";
import VendorProfile from "@/pages/vendor-profile";
import Affiliate from "@/pages/affiliate";
import Profile from "@/pages/profile";
import SocialFeed from "@/pages/social-feed";
import CreatePost from "@/pages/create-post";
import UserProfile from "@/pages/user-profile";
import AffiliateRedirect from "@/pages/affiliate-redirect";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import Cart from "@/pages/cart";
import Orders from "@/pages/orders";
import Neighborhoods from "@/pages/neighborhoods";
import Taxi from "@/pages/taxi";
import TaxiDriver from "@/pages/taxi-driver";
import HomeServices from "@/pages/home-services";
import BeautyServices from "@/pages/beauty-services";
import PrivacyPolicy from "@/pages/privacy-policy";
// Admin Pages
import { AdminLogin } from "@/pages/admin/admin-login";
import { AdminDashboard } from "@/pages/admin/admin-dashboard";
import { AdminSettings } from "@/pages/admin/admin-settings";
import { VerificationRequests } from "@/pages/admin/verification-requests";
import { UsersManagement } from "@/pages/admin/users-management";
import { StoresManagement } from "@/pages/admin/stores-management";
import { OrdersManagement } from "@/pages/admin/orders-management";
import { FeaturesManagement } from "@/pages/admin/features-management";
import EmailSettings from "@/pages/admin/email-settings";
import { SendAnnouncement } from "@/pages/admin/send-announcement";
import { AdminProtectedRoute } from "@/components/admin/admin-protected-route";

// Error Boundary Component للتعامل مع الأخطاء ومنع الشاشة السوداء
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('تطبيق Bivochat: خطأ غير متوقع:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
                حدث خطأ غير متوقع
              </h2>
              <p className="text-red-600 dark:text-red-300 mb-4">
                نعتذر، حدث خطأ في التطبيق. يرجى إعادة تحميل الصفحة.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                إعادة تحميل الصفحة
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  
  // إعادة تفعيل نظام الإشعارات العام للتطبيق
  useNotifications({
    enableSound: true,
    enableBrowserNotifications: true,
    soundVolume: 0.6
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#075e54] flex items-center justify-center">
        <div className="text-white text-lg">جارِ التحميل...</div>
      </div>
    );
  }

  return (
    <>
      <Switch>
        {/* Public Routes */}
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        
        {/* Admin Routes - Public */}
        <Route path="/admin/login" component={AdminLogin} />
        
        {/* Admin Routes - Protected */}
        <Route path="/admin/send-announcement">
          <AdminProtectedRoute>
            <SendAnnouncement />
          </AdminProtectedRoute>
        </Route>
        <Route path="/admin/verification-requests">
          <AdminProtectedRoute>
            <VerificationRequests />
          </AdminProtectedRoute>
        </Route>
        <Route path="/admin/users">
          <AdminProtectedRoute>
            <UsersManagement />
          </AdminProtectedRoute>
        </Route>
        <Route path="/admin/stores">
          <AdminProtectedRoute>
            <StoresManagement />
          </AdminProtectedRoute>
        </Route>
        <Route path="/admin/orders">
          <AdminProtectedRoute>
            <OrdersManagement />
          </AdminProtectedRoute>
        </Route>
        <Route path="/admin/features">
          <AdminProtectedRoute>
            <FeaturesManagement />
          </AdminProtectedRoute>
        </Route>
        <Route path="/admin/email-settings">
          <AdminProtectedRoute>
            <EmailSettings />
          </AdminProtectedRoute>
        </Route>
        <Route path="/admin/settings">
          <AdminProtectedRoute>
            <AdminSettings />
          </AdminProtectedRoute>
        </Route>
        <Route path="/admin">
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        </Route>
        
        {/* Regular App Routes */}
        {!isAuthenticated ? (
          <Route component={Login} />
        ) : (
          <>
            <Route path="/" component={Chat} />
            <Route path="/chat/:chatId" component={Chat} />
            <Route path="/status" component={Status} />
            <Route path="/calls" component={Calls} />
            <Route path="/vendors" component={Vendors} />
            <Route path="/stores" component={Stores} />
            <Route path="/product/:productId" component={ProductDetail} />
            <Route path="/my-vendor" component={MyVendor} />
            <Route path="/vendor/:vendorId" component={VendorProfile} />
            <Route path="/cart" component={Cart} />
            <Route path="/orders" component={Orders} />
            <Route path="/neighborhoods" component={Neighborhoods} />
            <Route path="/taxi" component={Taxi} />
            <Route path="/taxi-driver" component={TaxiDriver} />
            <Route path="/home-services" component={HomeServices} />
            <Route path="/beauty-services" component={BeautyServices} />
            <Route path="/affiliate" component={Affiliate} />
            <Route path="/affiliate/:uniqueCode" component={AffiliateRedirect} />
            <Route path="/profile" component={Profile} />
            <Route path="/social-feed" component={SocialFeed} />
            <Route path="/create-post" component={CreatePost} />
            <Route path="/user-profile/:userId" component={UserProfile} />
            <Route path="/profile/:userId" component={UserProfile} />
          </>
        )}
        
        <Route component={NotFound} />
      </Switch>
      
      {/* Only show bottom navigation for regular app routes */}
      {isAuthenticated && !location.startsWith('/admin') && (
        <BottomNavigation />
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="whatsapp-ui-theme">
        <QueryClientProvider client={queryClient}>
          <FeaturesProvider>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </AuthProvider>
          </FeaturesProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
