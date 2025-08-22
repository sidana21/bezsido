import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNavigation } from "@/components/bottom-navigation";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Chat from "@/pages/chat";
import Status from "@/pages/status";
import Stores from "@/pages/stores";
import MyStore from "@/pages/my-store";
import Affiliate from "@/pages/affiliate";
import Profile from "@/pages/profile";
import AffiliateRedirect from "@/pages/affiliate-redirect";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#075e54] flex items-center justify-center">
        <div className="text-white text-lg">جارِ التحميل...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <>
      <Switch>
        <Route path="/" component={Chat} />
        <Route path="/chat/:chatId" component={Chat} />
        <Route path="/status" component={Status} />
        <Route path="/stores" component={Stores} />
        <Route path="/my-store" component={MyStore} />
        <Route path="/affiliate" component={Affiliate} />
        <Route path="/affiliate/:uniqueCode" component={AffiliateRedirect} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
      <BottomNavigation />
    </>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="whatsapp-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
