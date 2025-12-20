/**
 * Meta Marketing API Integration
 * Handles fetching performance data from Meta Ads Manager
 */

interface MetaInsightsParams {
  adAccountId: string;
  accessToken: string;
  datePreset?: string;
  timeRange?: {
    since: string; // YYYY-MM-DD
    until: string; // YYYY-MM-DD
  };
  level?: "account" | "campaign" | "adset" | "ad";
  fields?: string[];
}

interface MetaInsightsResponse {
  data: Array<{
    ad_id?: string;
    ad_name?: string;
    campaign_id?: string;
    campaign_name?: string;
    adset_id?: string;
    adset_name?: string;
    impressions?: string;
    spend?: string;
    actions?: Array<{
      action_type: string;
      value: string;
    }>;
    clicks?: string;
    reach?: string;
    ctr?: string;
    cpc?: string;
    cpm?: string;
    date_start?: string;
    date_stop?: string;
  }>;
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

/**
 * Fetch insights from Meta Marketing API
 */
export async function fetchMetaInsights(
  params: MetaInsightsParams
): Promise<MetaInsightsResponse> {
  const {
    adAccountId,
    accessToken,
    datePreset = "last_7d",
    timeRange,
    level = "ad",
    fields = [
      "ad_id",
      "ad_name",
      "campaign_id",
      "campaign_name",
      "adset_id",
      "adset_name",
      "impressions",
      "spend",
      "actions",
      "clicks",
      "reach",
      "ctr",
      "cpc",
      "cpm",
      "date_start",
      "date_stop",
    ],
  } = params;

  // Construct API URL
  const baseUrl = `https://graph.facebook.com/v21.0/act_${adAccountId}/insights`;
  const url = new URL(baseUrl);

  // Add query parameters
  url.searchParams.append("access_token", accessToken);
  url.searchParams.append("level", level);
  url.searchParams.append("fields", fields.join(","));

  if (timeRange) {
    url.searchParams.append(
      "time_range",
      JSON.stringify({
        since: timeRange.since,
        until: timeRange.until,
      })
    );
  } else {
    url.searchParams.append("date_preset", datePreset);
  }

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Meta API Error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data: MetaInsightsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("[Meta API] Failed to fetch insights:", error);
    throw error;
  }
}

/**
 * Fetch insights for specific campaigns
 */
export async function fetchCampaignInsights(
  adAccountId: string,
  accessToken: string,
  campaignNames: string[]
): Promise<MetaInsightsResponse> {
  const insights = await fetchMetaInsights({
    adAccountId,
    accessToken,
    level: "campaign",
    datePreset: "last_30d",
  });

  // Filter by campaign names if provided
  if (campaignNames.length > 0) {
    insights.data = insights.data.filter((item) =>
      campaignNames.some((name) =>
        item.campaign_name?.toLowerCase().includes(name.toLowerCase())
      )
    );
  }

  return insights;
}

/**
 * Fetch insights for specific ads
 */
export async function fetchAdInsights(
  adAccountId: string,
  accessToken: string,
  adIds?: string[]
): Promise<MetaInsightsResponse> {
  const insights = await fetchMetaInsights({
    adAccountId,
    accessToken,
    level: "ad",
    datePreset: "last_30d",
  });

  // Filter by ad IDs if provided
  if (adIds && adIds.length > 0) {
    insights.data = insights.data.filter((item) =>
      adIds.includes(item.ad_id || "")
    );
  }

  return insights;
}

/**
 * Parse conversions from Meta actions array
 */
export function parseConversions(
  actions?: Array<{ action_type: string; value: string }>
): number {
  if (!actions) return 0;

  const conversionActions = [
    "offsite_conversion.fb_pixel_purchase",
    "offsite_conversion.fb_pixel_lead",
    "onsite_conversion.purchase",
    "onsite_conversion.lead",
  ];

  let totalConversions = 0;
  for (const action of actions) {
    if (conversionActions.includes(action.action_type)) {
      totalConversions += parseInt(action.value, 10) || 0;
    }
  }

  return totalConversions;
}

/**
 * Calculate CTR from impressions and clicks
 */
export function calculateCTR(impressions: number, clicks: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

/**
 * Calculate CPC from spend and clicks
 */
export function calculateCPC(spend: number, clicks: number): number {
  if (clicks === 0) return 0;
  return spend / clicks;
}

/**
 * Calculate CPM from spend and impressions
 */
export function calculateCPM(spend: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (spend / impressions) * 1000;
}
