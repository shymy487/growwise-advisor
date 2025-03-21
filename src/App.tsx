
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FarmDataProvider } from "@/contexts/FarmDataContext";
import { AnimatePresence } from "framer-motion";
import { StrictMode } from "react";

// Pages
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import SignOut from "./pages/SignOut";
import Dashboard from "./pages/Dashboard";
import InputData from "./pages/InputData";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";

// Configure React Query with proper settings to avoid memory leaks
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Wrap contexts */}
        <AuthProvider>
          <FarmDataProvider>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/signout" element={<SignOut />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/input" element={<InputData />} />
                <Route path="/results" element={<Results />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </FarmDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
