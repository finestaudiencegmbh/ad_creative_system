import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Download, ImageIcon, Loader2, Calendar, CheckCircle2, Clock, XCircle, Pause, Play, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

export default function CreativeLibrary() {
  const utils = trpc.useUtils();
  const { data: jobs, isLoading } = trpc.ai.getCreativeJobs.useQuery();

  const pauseJob = trpc.ai.pauseCreativeJob.useMutation({
    onSuccess: () => {
      toast.success("Job pausiert");
      utils.ai.getCreativeJobs.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const resumeJob = trpc.ai.resumeCreativeJob.useMutation({
    onSuccess: () => {
      toast.success("Job fortgesetzt");
      utils.ai.getCreativeJobs.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteJob = trpc.ai.deleteCreativeJob.useMutation({
    onSuccess: () => {
      toast.success("Job gelöscht");
      utils.ai.getCreativeJobs.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handlePause = (jobId: string) => {
    pauseJob.mutate({ jobId });
  };

  const handleResume = (jobId: string) => {
    resumeJob.mutate({ jobId });
  };

  const handleDelete = (jobId: string) => {
    if (confirm("Möchtest du diesen Job wirklich löschen?")) {
      deleteJob.mutate({ jobId });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Creative Library
          </h1>
          <p className="text-muted-foreground">
            Alle generierten Creatives zum Download
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!jobs || jobs.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-accent" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Noch keine Creatives generiert</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Generiere deine ersten Creatives im Creative Generator, um sie hier zu sehen.
              </p>
            </div>
          </div>
        )}

        {/* Jobs List */}
        {!isLoading && jobs && jobs.length > 0 && (
          <div className="space-y-6">
            {jobs.map((job: any) => (
              <div
                key={job.jobId}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-6 transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10"
              >
                {/* Job Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {job.format === "feed" && "Feed Creative"}
                        {job.format === "story" && "Story Creative"}
                        {job.format === "reel" && "Reel Creative"}
                      </h3>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(job.createdAt), "dd. MMM yyyy, HH:mm", { locale: de })} Uhr
                        </span>
                      </div>
                      {job.completedAt && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span>
                            Abgeschlossen: {format(new Date(job.completedAt), "HH:mm", { locale: de })} Uhr
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center gap-2">
                    {(job.status === "processing" || job.status === "pending") && (
                      <button
                        onClick={() => handlePause(job.jobId)}
                        disabled={pauseJob.isPending}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 text-sm font-medium transition-all duration-200 hover:bg-yellow-500/20 disabled:opacity-50"
                      >
                        <Pause className="w-4 h-4" />
                        Anhalten
                      </button>
                    )}

                    {job.status === "paused" && (
                      <button
                        onClick={() => handleResume(job.jobId)}
                        disabled={resumeJob.isPending}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 text-sm font-medium transition-all duration-200 hover:bg-green-500/20 disabled:opacity-50"
                      >
                        <Play className="w-4 h-4" />
                        Fortsetzen
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(job.jobId)}
                      disabled={deleteJob.isPending}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20 text-sm font-medium transition-all duration-200 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Löschen
                    </button>
                  </div>
                </div>

                {/* Landing Page URL */}
                {job.landingPageUrl && (
                  <div className="mb-4 p-3 rounded-lg bg-accent/5 border border-accent/10">
                    <p className="text-xs text-muted-foreground mb-1">Landing Page:</p>
                    <a
                      href={job.landingPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent hover:underline break-all"
                    >
                      {job.landingPageUrl}
                    </a>
                  </div>
                )}

                {/* Creatives Grid */}
                {job.status === "completed" && job.result?.creatives && Array.isArray(job.result.creatives) && job.result.creatives.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {job.result.creatives.map((creative: any, index: number) => (
                      <div
                        key={index}
                        className="group/card relative overflow-hidden rounded-xl border border-border/50 bg-background/50 p-4 transition-all duration-300 hover:border-accent/50 hover:shadow-lg"
                      >
                        {/* Creative Image */}
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-accent/5 mb-3">
                          <img
                            src={creative.url}
                            alt={`Creative ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                          />
                        </div>

                        {/* Creative Info */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {creative.format}
                            </span>
                            <a
                              href={creative.url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium transition-all duration-200 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/30"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </a>
                          </div>

                          {/* Text Overlays (if available) */}
                          {(creative.headline || creative.eyebrow || creative.cta) && (
                            <div className="pt-2 border-t border-border/30 space-y-1">
                              {creative.eyebrow && (
                                <p className="text-xs text-muted-foreground">{creative.eyebrow}</p>
                              )}
                              {creative.headline && (
                                <p className="text-sm font-semibold">{creative.headline}</p>
                              )}
                              {creative.cta && (
                                <p className="text-xs text-accent">{creative.cta}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Processing State with Progress Bar */}
                {(job.status === "processing" || job.status === "pending") && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {job.status === "pending" ? "Warte auf Start..." : "Creatives werden generiert..."}
                      </span>
                      <span className="text-accent font-medium">
                        {job.status === "pending" ? "0%" : "45%"}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-accent/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                        style={{
                          width: job.status === "pending" ? "0%" : "45%",
                          animation: job.status === "processing" ? "pulse 2s ease-in-out infinite" : "none",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Paused State */}
                {job.status === "paused" && (
                  <div className="flex items-center justify-center py-8 space-x-3">
                    <Pause className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm text-muted-foreground">
                      Job pausiert
                    </span>
                  </div>
                )}

                {/* Error State */}
                {job.status === "failed" && job.errorMessage && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-destructive">Generierung fehlgeschlagen</p>
                        <p className="text-xs text-muted-foreground">{job.errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: {
      icon: Clock,
      label: "Ausstehend",
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    },
    processing: {
      icon: Loader2,
      label: "In Bearbeitung",
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    paused: {
      icon: Pause,
      label: "Pausiert",
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    },
    completed: {
      icon: CheckCircle2,
      label: "Abgeschlossen",
      className: "bg-green-500/10 text-green-600 border-green-500/20",
    },
    failed: {
      icon: XCircle,
      label: "Fehlgeschlagen",
      className: "bg-red-500/10 text-red-600 border-red-500/20",
    },
  };

  const { icon: Icon, label, className } = config[status as keyof typeof config] || config.pending;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${className}`}>
      <Icon className={`w-3.5 h-3.5 ${status === "processing" ? "animate-spin" : ""}`} />
      {label}
    </div>
  );
}
