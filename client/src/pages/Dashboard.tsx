import DashboardLayout from "@/components/DashboardLayout";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DateRangeSelector } from "@/components/DateRangeSelector";
import { CampaignTabs } from "@/components/CampaignTabs";
import { CampaignList } from "@/components/CampaignList";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <AnimatedBackground />
      
      <div className="relative z-10 space-y-8">
        <DashboardHeader />
        
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Übersicht über alle aktiven und inaktiven Kampagnen
            </p>
          </div>

          <DateRangeSelector />
          
          <div className="flex items-center justify-between">
            <CampaignTabs />
          </div>

          <CampaignList />
        </div>
      </div>
    </DashboardLayout>
  );
}
