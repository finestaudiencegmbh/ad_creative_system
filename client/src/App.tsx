import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

import Dashboard from "./pages/Dashboard";
import CampaignDetail from "./pages/CampaignDetail";
import AdSetDetail from "./pages/AdSetDetail";
import CreativeGenerator from "./pages/CreativeGenerator";
import CreativeLibrary from "./pages/CreativeLibrary";
import Werbetexte from "./pages/Werbetexte";
import Performance from "./pages/Performance";
import Login from "./pages/Login";
import Accounts from "./pages/Accounts";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import JobStatusToast from "./components/JobStatusToast";

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/reset-password"} component={ResetPassword} />
      <Route path={"/"} component={Dashboard} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/accounts"} component={Accounts} />
      <Route path={"/campaign/:id"} component={CampaignDetail} />
      <Route path={"/adset/:id"} component={AdSetDetail} />
      <Route path={"/generator"} component={CreativeGenerator} />
      <Route path={"/creative-library"} component={CreativeLibrary} />
      <Route path={"/werbetexte"} component={Werbetexte} />
      <Route path={"/performance"} component={Performance} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <JobStatusToast />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
