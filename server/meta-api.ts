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
  cpm: string;
  outbound_clicks?: Array<{
    action_type: string;
    value: string;
  }>;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  action_values?: Array<{
    action_type: string;
    value: string;
  }>;
  cost_per_outbound_click?: Array<{
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

  // Build query parameters with all required metrics
  const queryParams = new URLSearchParams({
    access_token: accessToken,
    fields: "id,name,status,objective,created_time,updated_time,insights{impressions,spend,ctr,cpm,actions,outbound_clicks,cost_per_outbound_click}",
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

  // Build query parameters with all required metrics
  const queryParams = new URLSearchParams({
    access_token: accessToken,
    fields: "impressions,spend,ctr,cpm,actions,outbound_clicks,cost_per_outbound_click",
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
 * Fetch ad sets for a specific campaign
 */
export async function getCampaignAdSets(
  campaignId: string,
  params?: {
    datePreset?: string;
    timeRange?: { since: string; until: string };
  }
): Promise<CampaignWithInsights[]> {
  const accessToken = ENV.metaAccessToken;

  if (!accessToken) {
    throw new Error("META_ACCESS_TOKEN not configured");
  }

  // Build query parameters with all required metrics
  const queryParams = new URLSearchParams({
    access_token: accessToken,
    fields: "id,name,status,insights{impressions,spend,ctr,cpm,actions,outbound_clicks,cost_per_outbound_click}",
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

  const url = `${META_API_BASE_URL}/${campaignId}/adsets?${queryParams.toString()}`;

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
 * Fetch ads for a specific ad set
 */
export async function getAdSetAds(
  adSetId: string,
  params?: {
    datePreset?: string;
    timeRange?: { since: string; until: string };
  }
): Promise<CampaignWithInsights[]> {
  const accessToken = ENV.metaAccessToken;

  if (!accessToken) {
    throw new Error("META_ACCESS_TOKEN not configured");
  }

  // Build query parameters with all required metrics
  const queryParams = new URLSearchParams({
    access_token: accessToken,
    fields: "id,name,status,insights{impressions,spend,ctr,cpm,actions,outbound_clicks,cost_per_outbound_click}",
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

  const url = `${META_API_BASE_URL}/${adSetId}/ads?${queryParams.toString()}`;

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

/**
 * Fetch creative data for a specific ad (images, videos, text, website URL)
 */
export async function getAdCreatives(adId: string): Promise<any> {
  const accessToken = ENV.metaAccessToken;

  if (!accessToken) {
    throw new Error("META_ACCESS_TOKEN not configured");
  }

  // Get ad with creative field including asset_feed_spec for DCA ads
  const queryParams = new URLSearchParams({
    access_token: accessToken,
    fields: "id,name,creative{id,name,object_story_spec,asset_feed_spec,image_url,image_hash,thumbnail_url,video_id,body,link_url,title,call_to_action_type,effective_object_story_id,url_tags}",
  });

  const url = `${META_API_BASE_URL}/${adId}?${queryParams.toString()}`;

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
  
  // Return creative object, or empty object if not found
  return data.creative || {};
}

/**
 * Fetch audience targeting data for a specific ad set
 */
export async function getAdSetTargeting(adSetId: string): Promise<any> {
  const accessToken = ENV.metaAccessToken;

  if (!accessToken) {
    throw new Error("META_ACCESS_TOKEN not configured");
  }

  const queryParams = new URLSearchParams({
    access_token: accessToken,
    fields: "targeting",
  });

  const url = `${META_API_BASE_URL}/${adSetId}?${queryParams.toString()}`;

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
  return data.targeting || null;
}

/**
 * Extract landing page URL from ad creative
 */
export function extractLandingPageUrl(creative: any): string | null {
  // Return null if creative is undefined or null
  if (!creative) return null;
  
  // 1. Try DCA (Dynamic Creative Ads) asset_feed_spec.link_urls
  if (creative.asset_feed_spec?.link_urls && creative.asset_feed_spec.link_urls.length > 0) {
    // Return first URL from link_urls array
    const firstLinkUrl = creative.asset_feed_spec.link_urls[0];
    if (firstLinkUrl?.website_url) return firstLinkUrl.website_url;
  }
  
  // 2. Try direct link_url field
  if (creative.link_url) return creative.link_url;
  
  // 3. Try object_story_spec.link_data.link (standard single image/video ads)
  if (creative.object_story_spec?.link_data?.link) return creative.object_story_spec.link_data.link;
  
  // 4. Try object_story_spec.video_data.call_to_action.value.link (video ads)
  if (creative.object_story_spec?.video_data?.call_to_action?.value?.link) {
    return creative.object_story_spec.video_data.call_to_action.value.link;
  }
  
  return null;
}

/**
 * Extract image URL from ad creative
 */
export function extractImageUrl(creative: any): string | null {
  // Return null if creative is undefined or null
  if (!creative) return null;
  
  // 1. Try thumbnail_url (usually available for most ads)
  if (creative.thumbnail_url) return creative.thumbnail_url;
  
  // 2. Try image_url (direct image URL)
  if (creative.image_url) return creative.image_url;
  
  // 3. Try DCA asset_feed_spec.images (first image)
  if (creative.asset_feed_spec?.images && creative.asset_feed_spec.images.length > 0) {
    const firstImage = creative.asset_feed_spec.images[0];
    if (firstImage?.url) return firstImage.url;
    if (firstImage?.picture) return firstImage.picture;
  }
  
  // 4. Try object_story_spec.link_data.picture (for link posts)
  if (creative.object_story_spec?.link_data?.picture) {
    return creative.object_story_spec.link_data.picture;
  }
  
  // 5. Try to construct URL from image_hash if available
  if (creative.image_hash) {
    // Meta CDN URL pattern
    return `https://scontent.xx.fbcdn.net/v/t45.1600-4/${creative.image_hash}`;
  }
  
  return null;
}

/**
 * Get ad details including parent ad set and campaign IDs
 */
export async function getAdDetails(adId: string): Promise<{ adset_id: string; campaign_id: string }> {
  const accessToken = ENV.metaAccessToken;

  if (!accessToken) {
    throw new Error("META_ACCESS_TOKEN not configured");
  }

  const queryParams = new URLSearchParams({
    access_token: accessToken,
    fields: "adset_id,campaign_id",
  });

  const url = `${META_API_BASE_URL}/${adId}?${queryParams.toString()}`;

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
  return {
    adset_id: data.adset_id,
    campaign_id: data.campaign_id,
  };
}

/**
 * Get ad set details including parent campaign ID
 */
export async function getAdSetDetails(adSetId: string): Promise<{ campaign_id: string }> {
  const accessToken = ENV.metaAccessToken;

  if (!accessToken) {
    throw new Error("META_ACCESS_TOKEN not configured");
  }

  const queryParams = new URLSearchParams({
    access_token: accessToken,
    fields: "campaign_id",
  });

  const url = `${META_API_BASE_URL}/${adSetId}?${queryParams.toString()}`;

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
  return {
    campaign_id: data.campaign_id,
  };
}
