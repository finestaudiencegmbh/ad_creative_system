
import { useState } from "react"
import { cn } from "@/lib/utils"

export function CampaignTabs() {
  const [activeTab, setActiveTab] = useState("active")

  return (
    <div className="inline-flex p-1 bg-card/50 rounded-xl backdrop-blur-sm border border-border">
      <button
        onClick={() => setActiveTab("active")}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 relative overflow-hidden",
          activeTab === "active"
            ? "bg-accent text-white shadow-lg shadow-accent/30 scale-105"
            : "text-muted-foreground hover:text-foreground hover:bg-card/80 hover:shadow-md hover:scale-105",
        )}
      >
        {activeTab === "active" && (
          <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent/10 rounded-lg" />
        )}
        <span className="relative">Aktive Kampagnen (4)</span>
      </button>
      <button
        onClick={() => setActiveTab("inactive")}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 relative overflow-hidden",
          activeTab === "inactive"
            ? "bg-accent text-white shadow-lg shadow-accent/30 scale-105"
            : "text-muted-foreground hover:text-foreground hover:bg-card/80 hover:shadow-md hover:scale-105",
        )}
      >
        {activeTab === "inactive" && (
          <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent/10 rounded-lg" />
        )}
        <span className="relative">Inaktive Kampagnen (3)</span>
      </button>
    </div>
  )
}
