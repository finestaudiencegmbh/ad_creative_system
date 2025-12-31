import { Bell, Search, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardHeader() {
  return (
    <div className="sticky top-0 z-20 -mx-8 lg:-mx-12 px-8 lg:px-12 py-4 mb-8 backdrop-blur-xl bg-background/80 border-b border-border/60">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Home</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">Dashboard</span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-xl hover:bg-accent/10 hover:text-accent transition-colors"
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* Notifications with Badge */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-xl hover:bg-accent/10 hover:text-accent transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background animate-pulse" />
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-accent/10 hover:text-accent transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
