import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Target, DollarSign, MousePointerClick } from 'lucide-react';

export default function PerformanceDashboard() {
  const { data: topPerformers, isLoading: loadingTop } = trpc.ai.getTopPerformers.useQuery({ limit: 10 });
  const { data: lowPerformers, isLoading: loadingLow } = trpc.ai.getLowPerformers.useQuery({ limit: 5 });
  const { data: patterns, isLoading: loadingPatterns } = trpc.ai.getWinningPatterns.useQuery();

  if (loadingTop || loadingLow || loadingPatterns) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Analysiere deine Creative-Performance und optimiere kontinuierlich
        </p>
      </div>

      {/* Key Metrics */}
      {patterns && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. CTR</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(patterns.avgCTR * 100).toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">Top 20 Performer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. CPL</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{patterns.avgCPL.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Cost per Lead</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. ROAS</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patterns.avgROAS.toFixed(2)}x</div>
              <p className="text-xs text-muted-foreground">Return on Ad Spend</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <CardTitle>Top Performer</CardTitle>
          </div>
          <CardDescription>
            Deine erfolgreichsten Creatives nach ROAS sortiert
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topPerformers?.map((creative: any) => (
              <Card key={creative.creativeId} className="overflow-hidden">
                <img 
                  src={creative.imageUrl} 
                  alt={creative.headline}
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{creative.format}</Badge>
                    <Badge className="bg-green-600">{creative.performanceScore}/100</Badge>
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-2">{creative.headline}</h3>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <div className="font-medium text-foreground">{(creative.ctr * 100).toFixed(2)}%</div>
                      <div>CTR</div>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">€{creative.cpl.toFixed(2)}</div>
                      <div>CPL</div>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{creative.roas.toFixed(2)}x</div>
                      <div>ROAS</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Low Performers */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <CardTitle>Low Performer</CardTitle>
          </div>
          <CardDescription>
            Diese Creatives solltest du pausieren oder optimieren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowPerformers?.map((creative: any) => (
              <Card key={creative.creativeId} className="overflow-hidden opacity-75">
                <img 
                  src={creative.imageUrl} 
                  alt={creative.headline}
                  className="w-full h-48 object-cover grayscale"
                />
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{creative.format}</Badge>
                    <Badge variant="destructive">{creative.performanceScore}/100</Badge>
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-2">{creative.headline}</h3>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <div className="font-medium text-foreground">{(creative.ctr * 100).toFixed(2)}%</div>
                      <div>CTR</div>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">€{creative.cpl.toFixed(2)}</div>
                      <div>CPL</div>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{creative.roas.toFixed(2)}x</div>
                      <div>ROAS</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Winning Patterns */}
      {patterns && (
        <Card>
          <CardHeader>
            <CardTitle>Winning Patterns</CardTitle>
            <CardDescription>
              Erfolgreiche Headlines, Eyebrows und CTAs aus deinen Top-Performern
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Top Headlines</h4>
              <div className="space-y-1">
                {patterns.topHeadlines.slice(0, 5).map((headline: string, i: number) => (
                  <div key={i} className="text-sm text-muted-foreground">
                    {i + 1}. {headline}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Top Eyebrows</h4>
              <div className="flex flex-wrap gap-2">
                {patterns.topEyebrows.slice(0, 5).map((eyebrow: string, i: number) => (
                  <Badge key={i} variant="secondary">{eyebrow}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Top CTAs</h4>
              <div className="flex flex-wrap gap-2">
                {patterns.topCTAs.slice(0, 5).map((cta: string, i: number) => (
                  <Badge key={i} variant="outline">{cta}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
