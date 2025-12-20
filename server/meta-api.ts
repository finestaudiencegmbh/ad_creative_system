/**
 * Meta Marketing API Integration
 * 
 * This module provides helpers to interact with Meta Marketing API
 * to fetch campaign data, insights, and performance metrics.
 */

import { ENV } from "./_core/env";

const META_API_VERSION = "v21.0";
const META_API_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  created_time?: string;
  updated_time?: string;
}

interface MetaInsights {
  impressions: string;
  spend: string;
  ctr: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
}

interface CampaignWithInsights extends MetaCampaign {
  insights?: {
    data: MetaInsights[];
  };
}

/**
 * Fetch campaigns from Meta Ad Account
 */
export async function getMetaCampaigns(params?: {
  datePreset?: string;
  timeRange?: { since: string; until: string };
}): Promise<CampaignWithInsights[]> {
  const accessToken = ENV.metaAccessToken;
  const adAccountId = ENV.metaAdAccountId;

  if (!accessToken || !adAccountId) {
    throw new Error("META_ACCESS_TOKEN or META_AD_ACCOUNT_ID not configured");
  }

  // Build query parameters
  const queryParams = new URLSearchParams({
    access_token: accessToken,
    fields: "id,name,status,objective,created_time,updated_time,insights{impressions,spend,ctr,actions}",
    limit: "100",
  });

  // Add date filtering if provided
  if (params?.datePreset) {
    queryParams.append("date_preset", params.datePreset);
  } else if (params?.timeRange) {
    queryParams.append(
      "time_range",
      JSON.stringify({
        since: params.timeRange.since,
        until: params.timeRange.until,
      })
    );
  }

  const url = `${META_API_BASE_URL}/${adAccountId}/campaigns?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Meta API Error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Fetch insights for a specific campaign
 */
export async function getCampaignInsights(
  campaignId: string,
  params?: {
    datePreset?: string;
    timeRange?: { since: string; until: string };
  }
): Promise<MetaInsights | null> {
  const accessToken = ENV.metaAccessToken;

  if (!accessToken) {
    throw new Error("META_ACCESS_TOKEN not configured");
  }

  // Build query parameters
  const queryParams = new URLSearchParams({
    access_token: accessToken,
    fields: "impressions,spend,ctr,actions",
  });

  // Add date filtering if provided
  if (params?.datePreset) {
    queryParams.append("date_preset", params.datePreset);
  } else if (params?.timeRange) {
    queryParams.append(
      "time_range",
      JSON.stringify({
        since: params.timeRange.since,
        until: params.timeRange.until,
      })
    );
  }

  const url = `${META_API_BASE_URL}/${campaignId}/insights?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Meta API Error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  return data.data?.[0] || null;
}

/**
 * Test Meta API connection
 */
export async function testMetaConnection(): Promise<{
  success: boolean;
  accountId?: string;
  accountName?: string;
  error?: string;
}> {
  try {
    const accessToken = ENV.metaAccessToken;
    const adAccountId = ENV.metaAdAccountId;

    if (!accessToken || !adAccountId) {
      return {
        success: false,
        error: "META_ACCESS_TOKEN or META_AD_ACCOUNT_ID not configured",
      };
    }

    const url = `${META_API_BASE_URL}/${adAccountId}?access_token=${accessToken}&fields=id,name,account_status`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `API Error: ${response.status} - ${JSON.stringify(errorData)}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      accountId: data.id,
      accountName: data.name,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
