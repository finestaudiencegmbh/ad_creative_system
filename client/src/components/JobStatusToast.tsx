import React, { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { X, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ActiveJob {
  jobId: string;
  format: string;
  status: string;
  createdAt: Date;
}

export default function JobStatusToast() {
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const utils = trpc.useUtils();

  // Poll for active jobs every 5 seconds
  const { data: jobs } = trpc.ai.getCreativeJobs.useQuery(undefined, {
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: true, // Continue polling when tab is inactive
  });

  useEffect(() => {
    if (!jobs) return;

    // Filter active jobs (pending or processing)
    const active = jobs.filter(
      (job: any) =>
        (job.status === "pending" || job.status === "processing") &&
        !dismissed.has(job.jobId)
    );

    // Check for newly completed jobs
    const previousJobIds = new Set(activeJobs.map((j) => j.jobId));
    const completedJobs = jobs.filter(
      (job: any) =>
        job.status === "completed" &&
        previousJobIds.has(job.jobId) &&
        !dismissed.has(job.jobId)
    );

    // Show toast notification for completed jobs
    completedJobs.forEach((job: any) => {
      toast.success(`Creative ${job.format} fertig!`, {
        description: "Dein Creative wurde erfolgreich generiert.",
        action: {
          label: "Ansehen",
          onClick: () => {
            window.location.href = "/creative-library";
          },
        },
      });
      // Auto-dismiss completed job after showing toast
      setDismissed((prev) => new Set(prev).add(job.jobId));
    });

    // Check for failed jobs
    const failedJobs = jobs.filter(
      (job: any) =>
        job.status === "failed" &&
        previousJobIds.has(job.jobId) &&
        !dismissed.has(job.jobId)
    );

    failedJobs.forEach((job: any) => {
      toast.error(`Creative ${job.format} fehlgeschlagen`, {
        description: job.errorMessage || "Ein Fehler ist aufgetreten.",
      });
      setDismissed((prev) => new Set(prev).add(job.jobId));
    });

    setActiveJobs(active);
  }, [jobs, dismissed]);

  // Don't render if no active jobs
  if (activeJobs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {activeJobs.map((job) => (
        <div
          key={job.jobId}
          className="bg-card border border-border rounded-lg shadow-lg p-4 backdrop-blur-xl animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <div>
                <p className="text-sm font-semibold">
                  {job.format === "feed" && "Feed Creative"}
                  {job.format === "story" && "Story Creative"}
                  {job.format === "reel" && "Reel Creative"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {job.status === "pending" ? "Warte auf Start..." : "Wird generiert..."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(job.jobId))}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-accent/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
              style={{
                width: job.status === "pending" ? "10%" : "45%",
                animation: job.status === "processing" ? "pulse 2s ease-in-out infinite" : "none",
              }}
            />
          </div>

          {/* Time elapsed */}
          <p className="text-xs text-muted-foreground mt-2">
            Gestartet vor {Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 1000)}s
          </p>
        </div>
      ))}
    </div>
  );
}
