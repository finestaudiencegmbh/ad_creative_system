import { useAuth } from "@/_core/hooks/useAuth";
import { LayoutDashboard, Sparkles, FileText, TrendingUp, Users, ChevronRight, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", tabId: "campaigns" },
  { icon: Sparkles, label: "Creative Generator", path: "/generator", tabId: "generator" },
  { icon: FileText, label: "Werbetexte", path: "/werbetexte", tabId: "creatives" },
  { icon: TrendingUp, label: "Performance", path: "/performance", tabId: "performance" },
  { icon: Users, label: "Accounts", path: "/accounts", adminOnly: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    // Redirect to login page
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    return null;
  }

  const filteredMenuItems = menuItems.filter(item => {
    // Show Accounts only to super_admin and admin
    if (item.adminOnly) {
      return user?.role === "super_admin" || user?.role === "admin";
    }
    
    // Check tab permissions for customer users
    if (user?.role === "customer" && item.tabId) {
      // Parse tab permissions
      let tabPermissions: string[] | null = null;
      try {
        tabPermissions = user.tabPermissions ? JSON.parse(user.tabPermissions) : null;
      } catch (e) {
        console.error("Failed to parse tab permissions", e);
      }
      
      // null = all tabs allowed
      if (tabPermissions === null) return true;
      
      // Check if tab is in permissions list
      return tabPermissions.includes(item.tabId);
    }
    
    return true;
  });

  return (
    <div className="relative min-h-screen bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent/8 rounded-full blur-2xl animate-float-slower" />
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 h-screen bg-sidebar/95 backdrop-blur-2xl border-r border-sidebar-border relative z-20 flex flex-col">
          <div className="p-8 space-y-10 flex-1">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer transition-transform duration-300 hover:translate-x-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent via-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/30 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-accent/50 group-hover:scale-110 group-hover:rotate-3">
                <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-lg tracking-tight leading-tight text-sidebar-foreground">
                  Finest Ads
                </span>
                <span className="text-xs text-muted-foreground font-medium">Performance Dashboard</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {filteredMenuItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => setLocation(item.path)}
                    className={cn(
                      "group flex items-center gap-3.5 px-4 h-14 rounded-xl text-[15px] font-medium transition-all duration-200 relative overflow-hidden w-full",
                      isActive
                        ? "bg-gradient-to-r from-accent via-accent/90 to-accent/80 text-white shadow-lg shadow-accent/40"
                        : "bg-sidebar-accent/70 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:shadow-md hover:shadow-accent/20 hover:scale-[1.02] active:scale-[0.98]",
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                    )}

                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0",
                        isActive ? "bg-white/20" : "bg-background/40 group-hover:bg-background/60",
                      )}
                    >
                      <item.icon className="w-5 h-5 transition-all duration-200" />
                    </div>
                    <span className="tracking-tight font-semibold flex-1 text-left">{item.label}</span>

                    <ChevronRight
                      className={cn(
                        "w-4 h-4 transition-all duration-200",
                        isActive
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
                      )}
                    />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Profile */}
          <div className="p-6 border-t border-sidebar-border bg-sidebar-accent/30 backdrop-blur-sm">
            <button 
              onClick={logout}
              className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-sidebar-accent/60 transition-all duration-300 cursor-pointer group hover:scale-[1.02] active:scale-[0.98] w-full text-left"
            >
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent via-accent to-accent/80 flex items-center justify-center text-white text-[15px] font-semibold shadow-lg shadow-accent/30 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-accent/50 group-hover:scale-105">
                  {user?.name?.charAt(0).toUpperCase() || "F"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-sidebar rounded-full shadow-sm">
                  <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold truncate text-sidebar-foreground leading-tight">
                  {user?.name || "Finest Audience Admin"}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium">
                  {user?.email || "admin@finest-ads.com"}
                </p>
              </div>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative z-10">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
