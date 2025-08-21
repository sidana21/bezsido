import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNavigation } from "@/components/bottom-navigation";
import Chat from "@/pages/chat";
import Status from "@/pages/status";
import Stores from "@/pages/stores";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={Chat} />
        <Route path="/status" component={Status} />
        <Route path="/stores" component={Stores} />
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
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
