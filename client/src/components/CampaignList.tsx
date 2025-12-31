
import { useState } from "react"
import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const campaigns = [
  {
    id: "120236291446940214",
    name: "DCA Methode -- Leads -- 25.11.25",
    status: "Aktiv",
    ausgaben: "€1.894,30",
    roas: "-",
    roasPositive: false,
    leads: "64",
    corrected: true,
    kostenPerLead: "€29,60",
    trend: "down",
    progress: 45,
  },
  {
    id: "120236134701820214",
    name: "GAM -- Testing -- Leads 29.11.25 (ABO)",
    status: "Aktiv",
    ausgaben: "€6.792,17",
    roas: "2.80x",
    roasPositive: true,
    leads: "379",
    corrected: false,
    kostenPerLead: "€17,92",
    trend: "up",
    progress: 92,
  },
  {
    id: "120235886243950214",
    name: "Funnel Vorlagen -- Leads -- 18.11.25",
    status: "Aktiv",
    ausgaben: "€2.071,81",
    roas: "1.93x",
    roasPositive: true,
    leads: "159",
    corrected: false,
    kostenPerLead: "€13,03",
    trend: "up",
    progress: 78,
  },
  {
    id: "120235005942390214",
    name: "GAM -- Leads -- 3.11.25 (CBO)",
    status: "Aktiv",
    ausgaben: "€5.150,74",
    roas: "2.33x",
    roasPositive: true,
    leads: "375",
    corrected: false,
    kostenPerLead: "€13,74",
    trend: "up",
    progress: 85,
  },
]

export function CampaignList() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => {
        const isExpanded = expandedId === campaign.id

        return (
          <div
            key={campaign.id}
            className={cn(
              "group relative bg-card/60 backdrop-blur-xl rounded-2xl border overflow-hidden transition-all duration-500",
              "hover:shadow-[0_8px_30px_rgba(95,47,175,0.25)] hover:scale-[1.01]",
              isExpanded
                ? "border-accent/60 shadow-[0_0_40px_rgba(95,47,175,0.3)]"
                : "border-border shadow-sm hover:border-accent/40",
            )}
          >
            <div
              className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                "bg-gradient-to-br from-accent/[0.08] via-transparent to-transparent",
              )}
            />

            {/* Campaign Header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : campaign.id)}
              className="relative w-full p-6 flex items-center justify-between text-left"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold group-hover:text-accent transition-colors">{campaign.name}</h3>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "bg-accent/10 text-accent border-accent/30 font-medium px-3 py-1",
                      "shadow-[0_0_20px_rgba(95,47,175,0.15)]",
                    )}
                  >
                    {campaign.status}
                  </Badge>
                  {campaign.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Kampagnen-ID: {campaign.id}</p>
              </div>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-muted-foreground group-hover:text-accent transition-all duration-300",
                  isExpanded && "rotate-180",
                )}
              />
            </button>

            {/* Campaign Metrics */}
            <div className="relative px-6 pb-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ausgaben</p>
                <p className="text-2xl font-semibold">{campaign.ausgaben}</p>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent/60 rounded-full" style={{ width: `${campaign.progress}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">ROAS</p>
                <p
                  className={cn(
                    "text-2xl font-semibold",
                    campaign.roasPositive ? "text-green-600" : "text-muted-foreground",
                  )}
                >
                  {campaign.roas}
                </p>
                {campaign.roasPositive && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                    Profitable
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Leads</p>
                  {campaign.corrected && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      Korrigiert
                    </span>
                  )}
                </div>
                <p className="text-2xl font-semibold">{campaign.leads}</p>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${campaign.progress}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Kosten/Lead</p>
                <p className="text-2xl font-semibold">{campaign.kostenPerLead}</p>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500/60 rounded-full"
                    style={{ width: `${100 - campaign.progress / 2}%` }}
                  />
                </div>
              </div>
            </div>

            <div
              className={cn(
                "overflow-hidden transition-all duration-500",
                isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <div className="px-6 pb-6 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Zusätzliche Kampagnen-Details würden hier angezeigt werden...
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
