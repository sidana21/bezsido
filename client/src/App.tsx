import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNavigation } from "@/components/bottom-navigation";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { FeaturesProvider } from "@/hooks/use-features";
import Chat from "@/pages/chat";
import Status from "@/pages/status";
import Stores from "@/pages/stores";
import ProductDetail from "@/pages/product-detail";
import MyStore from "@/pages/my-store";
import Affiliate from "@/pages/affiliate";
import Profile from "@/pages/profile";
import AffiliateRedirect from "@/pages/affiliate-redirect";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import Cart from "@/pages/cart";
import Orders from "@/pages/orders";
// Admin Pages
import { AdminLogin } from "@/pages/admin/admin-login";
import { AdminDashboard } from "@/pages/admin/admin-dashboard";
import { AdminSettings } from "@/pages/admin/admin-settings";
import { VerificationRequests } from "@/pages/admin/verification-requests";
import { UsersManagement } from "@/pages/admin/users-management";
import { StoresManagement } from "@/pages/admin/stores-management";
import { OrdersManagement } from "@/pages/admin/orders-management";
import { FeaturesManagement } from "@/pages/admin/features-management";
import { AdminProtectedRoute } from "@/components/admin/admin-protected-route";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

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
        {/* Admin Routes - Public */}
        <Route path="/admin/login" component={AdminLogin} />
        
        {/* Admin Routes - Protected */}
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
            <Route path="/stores" component={Stores} />
            <Route path="/product/:productId" component={ProductDetail} />
            <Route path="/my-store" component={MyStore} />
            <Route path="/cart" component={Cart} />
            <Route path="/orders" component={Orders} />
            <Route path="/affiliate" component={Affiliate} />
            <Route path="/affiliate/:uniqueCode" component={AffiliateRedirect} />
            <Route path="/profile" component={Profile} />
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
  );
}

export default App;
