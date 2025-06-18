import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Import pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Jadwal from "@/pages/jadwal";
import Piket from "@/pages/piket";
import Kas from "@/pages/kas";
import Chat from "@/pages/chat";
import Diskusi from "@/pages/diskusi";
import PR from "@/pages/pr";
import Games from "@/pages/games";
import Info from "@/pages/info";
import Admin from "@/pages/admin";
import Profile from "@/pages/profile";
import UcapanUltah from "@/pages/ucapan-ultah";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      
      {/* Protected routes */}
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/jadwal" component={Jadwal} />
      <Route path="/piket" component={Piket} />
      <Route path="/kas" component={Kas} />
      <Route path="/chat" component={Chat} />
      <Route path="/diskusi" component={Diskusi} />
      <Route path="/pr" component={PR} />
      <Route path="/games" component={Games} />
      <Route path="/info" component={Info} />
      <Route path="/admin" component={Admin} />
      <Route path="/profile" component={Profile} />
      <Route path="/ucapan-ultah" component={UcapanUltah} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
