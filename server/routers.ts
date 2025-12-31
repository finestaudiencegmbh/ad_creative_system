import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as metaApi from "./metaApi";
import * as aiServices from "./aiServices";
import { getMetaCampaigns, getCampaignInsights, getCampaignAdSets, getAdSetAds } from "./meta-api";
import { authRouter } from "./routers/auth";
import { accountsRouter } from "./routers/accounts";
import { passwordResetRouter } from "./routers/password-reset";
import { passwordGeneratorRouter } from "./routers/password-generator";
import { usersRouter } from "./routers/users";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  accounts: accountsRouter,
  users: usersRouter,
  passwordReset: passwordResetRouter,
  passwordGenerator: passwordGeneratorRouter,

  // ============================================
  // Campaigns (Real Meta Data)
  // ============================================
  campaigns: router({
    list: protectedProcedure
      .input(z.object({
        datePreset: z.enum(["today", "last_7d", "last_30d", "this_month", "last_90d"]).optional(),
        timeRange: z.object({
          since: z.string(),
          until: z.string(),
        }).optional(),
      }))
      .query(async ({ input }) => {
        try {
          const campaigns = await getMetaCampaigns({
            datePreset: input.datePreset,
            timeRange: input.timeRange,
          });

          // Calculate date range for sales filtering
          let startDate: Date | undefined;
          let endDate: Date | undefined;
          if (input.timeRange) {
            startDate = new Date(input.timeRange.since);
            endDate = new Date(input.timeRange.until);
          }

          // Transform Meta API response to our format with ROAS
          return await Promise.all(campaigns.map(async campaign => {
            const insights = campaign.insights?.data?.[0];
            
            // Extract leads from actions array
            let leadsFromMeta = 0;
            if (insights?.actions) {
              const leadAction = insights.actions.find(
                (action: any) => action.action_type === "lead" || 
                         action.action_type === "offsite_conversion.fb_pixel_lead"
              );
              leadsFromMeta = leadAction ? parseInt(leadAction.value) : 0;
            }

            // Check for manual lead correction
            const leadCorrection = await db.getLeadCorrectionByEntity({ metaCampaignId: campaign.id });
            const leads = leadCorrection ? leadCorrection.correctedLeadCount : leadsFromMeta;
            const hasLeadCorrection = !!leadCorrection;

            // Extract outbound clicks
            let outboundClicks = 0;
            if (insights?.outbound_clicks) {
              const outboundClickAction = insights.outbound_clicks.find(
                (action: any) => action.action_type === "outbound_click"
              );
              outboundClicks = outboundClickAction ? parseInt(outboundClickAction.value) : 0;
            }

            // Extract cost per outbound click
            let costPerOutboundClick = 0;
            if (insights?.cost_per_outbound_click) {
              const costAction = insights.cost_per_outbound_click.find(
                (action: any) => action.action_type === "outbound_click"
              );
              costPerOutboundClick = costAction ? parseFloat(costAction.value) : 0;
            }

            const impressions = insights ? parseInt(insights.impressions) : 0;
            const spend = insights ? parseFloat(insights.spend) : 0;
            const cpm = insights ? parseFloat(insights.cpm) : 0;
            
            // Calculate derived metrics
            const costPerLead = leads > 0 ? spend / leads : 0;
            const outboundCtr = impressions > 0 ? (outboundClicks / impressions) * 100 : 0;
            const conversionRate = outboundClicks > 0 ? (leads / outboundClicks) * 100 : 0;

            // Fetch sales for ROAS calculation
            const sales = await db.getSalesByEntity({
              metaCampaignId: campaign.id,
              startDate,
              endDate,
            });

            // Calculate ROAS metrics
            const totalOrderValue = sales.reduce((sum, sale) => sum + parseFloat(sale.orderValue), 0);
            const totalCashCollect = sales.reduce((sum, sale) => sum + parseFloat(sale.cashCollect), 0);
            const roasOrderVolume = spend > 0 ? totalOrderValue / spend : 0;
            const roasCashCollect = spend > 0 ? totalCashCollect / spend : 0;

            return {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              impressions,
              spend,
              leads,
              leadsFromMeta,
              hasLeadCorrection,
              costPerLead,
              cpm,
              outboundClicks,
              outboundCtr,
              costPerOutboundClick,
              conversionRate,
              totalOrderValue,
              totalCashCollect,
              roasOrderVolume,
              roasCashCollect,
              salesCount: sales.length,
            };
          }));
        } catch (error) {
          console.error("Error fetching campaigns:", error);
          throw error;
        }
      }),

    getById: protectedProcedure
      .input(z.object({
        campaignId: z.string(),
        datePreset: z.enum(["today", "last_7d", "last_30d", "this_month", "last_90d"]).optional(),
        timeRange: z.object({
          since: z.string(),
          until: z.string(),
        }).optional(),
      }))
      .query(async ({ input }) => {
        try {
          const insights = await getCampaignInsights(input.campaignId, {
            datePreset: input.datePreset,
            timeRange: input.timeRange,
          });

          if (!insights) {
            return null;
          }

          // Extract conversions from actions array
          let conversions = 0;
          if (insights.actions) {
            const conversionAction = insights.actions.find(
              action => action.action_type === "offsite_conversion.fb_pixel_purchase" || 
                       action.action_type === "omni_purchase"
            );
            conversions = conversionAction ? parseInt(conversionAction.value) : 0;
          }

          return {
            impressions: parseInt(insights.impressions),
            spend: parseFloat(insights.spend),
            ctr: parseFloat(insights.ctr),
            conversions,
          };
        } catch (error) {
          console.error("Error fetching campaign insights:", error);
          throw error;
        }
      }),

    getAdSets: protectedProcedure
      .input(z.object({
        campaignId: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          const adSets = await getCampaignAdSets(input.campaignId);
          
          // Return ad sets with id and name, filter for active ones
          return adSets
            .filter(adSet => adSet.status === 'ACTIVE')
            .map(adSet => ({
              id: adSet.id,
              name: adSet.name,
              status: adSet.status,
            }));
        } catch (error) {
          console.error("Error fetching ad sets:", error);
          throw error;
        }
      }),

    getPerformanceData: protectedProcedure
      .input(z.object({
        campaignId: z.string().optional(),
        adSetId: z.string().optional(),
        timeRange: z.object({
          since: z.string(),
          until: z.string(),
        }),
      }))
      .query(async ({ input }) => {
        try {
          const { identifyWinningCreatives } = await import('./winning-creatives');
          
          // Calculate date range for sales filtering
          const startDate = new Date(input.timeRange.since);
          const endDate = new Date(input.timeRange.until);

          // Fetch ads based on filters
          let allAds: any[] = [];
          
          if (input.adSetId) {
            // Specific ad set
            allAds = await getAdSetAds(input.adSetId, {
              timeRange: input.timeRange,
            });
          } else if (input.campaignId) {
            // All ad sets in campaign
            const adSets = await getCampaignAdSets(input.campaignId, {
              timeRange: input.timeRange,
            });
            for (const adSet of adSets) {
              const ads = await getAdSetAds(adSet.id, {
                timeRange: input.timeRange,
              });
              allAds.push(...ads);
            }
          } else {
            // All campaigns
            const campaigns = await getMetaCampaigns({
              timeRange: input.timeRange,
            });
            for (const campaign of campaigns) {
              if (campaign.status === 'ACTIVE') {
                const adSets = await getCampaignAdSets(campaign.id, {
                  timeRange: input.timeRange,
                });
                for (const adSet of adSets) {
                  const ads = await getAdSetAds(adSet.id, {
                    timeRange: input.timeRange,
                  });
                  allAds.push(...ads);
                }
              }
            }
          }

          // Transform ads to performance data
          const adsWithPerformance = await Promise.all(allAds.map(async ad => {
            const insights = ad.insights?.data?.[0];
            
            // Extract metrics
            let leadsFromMeta = 0;
            if (insights?.actions) {
              const leadAction = insights.actions.find(
                (action: any) => action.action_type === "lead" || 
                         action.action_type === "offsite_conversion.fb_pixel_lead"
              );
              leadsFromMeta = leadAction ? parseInt(leadAction.value) : 0;
            }

            const leadCorrection = await db.getLeadCorrectionByEntity({ metaAdId: ad.id });
            const leads = leadCorrection ? leadCorrection.correctedLeadCount : leadsFromMeta;

            let outboundClicks = 0;
            if (insights?.outbound_clicks) {
              const outboundClickAction = insights.outbound_clicks.find(
                (action: any) => action.action_type === "outbound_click"
              );
              outboundClicks = outboundClickAction ? parseInt(outboundClickAction.value) : 0;
            }

            const impressions = insights ? parseInt(insights.impressions) : 0;
            const spend = insights ? parseFloat(insights.spend) : 0;
            const cpm = insights ? parseFloat(insights.cpm) : 0;
            
            const costPerLead = leads > 0 ? spend / leads : 0;
            const outboundCtr = impressions > 0 ? (outboundClicks / impressions) * 100 : 0;
            
            let costPerOutboundClick = 0;
            if (insights?.cost_per_outbound_click) {
              const costAction = insights.cost_per_outbound_click.find(
                (action: any) => action.action_type === "outbound_click"
              );
              costPerOutboundClick = costAction ? parseFloat(costAction.value) : 0;
            }

            // Fetch sales for ROAS
            const sales = await db.getSalesByEntity({
              metaAdId: ad.id,
              startDate,
              endDate,
            });

            const totalOrderValue = sales.reduce((sum, sale) => sum + parseFloat(sale.orderValue), 0);
            const totalCashCollect = sales.reduce((sum, sale) => sum + parseFloat(sale.cashCollect), 0);
            const roasOrderVolume = spend > 0 ? totalOrderValue / spend : 0;
            const roasCashCollect = spend > 0 ? totalCashCollect / spend : 0;

            // Extract image URL from creative
            const imageUrl = ad.creative?.thumbnail_url || ad.creative?.image_url || null;

            return {
              id: ad.id,
              name: ad.name,
              imageUrl,
              roasOrderVolume,
              roasCashCollect,
              costPerLead,
              costPerOutboundClick,
              outboundCtr,
              cpm,
              spend,
              leads,
              impressions,
            };
          }));

          // Get top performers and flops
          const topPerformers = identifyWinningCreatives(adsWithPerformance, 3);
          // For flops, reverse sort by score (lowest scores first)
          const allScored = identifyWinningCreatives(adsWithPerformance, adsWithPerformance.length);
          const topFlops = allScored.slice(-3).reverse();

          // Get campaign overview
          let campaignOverview: any[] = [];
          if (input.campaignId) {
            // Single campaign
            const campaign = await getMetaCampaigns({
              timeRange: input.timeRange,
            }).then(campaigns => campaigns.find(c => c.id === input.campaignId));
            
            if (campaign) {
              const insights = campaign.insights?.data?.[0];
              const impressions = insights ? parseInt(insights.impressions) : 0;
              const spend = insights ? parseFloat(insights.spend) : 0;
              
              let outboundClicks = 0;
              if (insights?.outbound_clicks) {
                const outboundClickAction = insights.outbound_clicks.find(
                  action => action.action_type === "outbound_click"
                );
                outboundClicks = outboundClickAction ? parseInt(outboundClickAction.value) : 0;
              }

              const ctr = impressions > 0 ? (outboundClicks / impressions) * 100 : 0;

              const sales = await db.getSalesByEntity({
                metaCampaignId: campaign.id,
                startDate,
                endDate,
              });

              const totalOrderValue = sales.reduce((sum, sale) => sum + parseFloat(sale.orderValue), 0);
              const roas = spend > 0 ? totalOrderValue / spend : 0;

              campaignOverview = [{
                id: campaign.id,
                name: campaign.name,
                impressions,
                clicks: outboundClicks,
                ctr,
                spend,
                roas,
              }];
            }
          } else {
            // All active campaigns
            const campaigns = await getMetaCampaigns({
              timeRange: input.timeRange,
            });
            
            campaignOverview = await Promise.all(
              campaigns
                .filter(c => c.status === 'ACTIVE')
                .map(async campaign => {
                  const insights = campaign.insights?.data?.[0];
                  const impressions = insights ? parseInt(insights.impressions) : 0;
                  const spend = insights ? parseFloat(insights.spend) : 0;
                  
                  let outboundClicks = 0;
                  if (insights?.outbound_clicks) {
                    const outboundClickAction = insights.outbound_clicks.find(
                      action => action.action_type === "outbound_click"
                    );
                    outboundClicks = outboundClickAction ? parseInt(outboundClickAction.value) : 0;
                  }

                  const ctr = impressions > 0 ? (outboundClicks / impressions) * 100 : 0;

                  const sales = await db.getSalesByEntity({
                    metaCampaignId: campaign.id,
                    startDate,
                    endDate,
                  });

                  const totalOrderValue = sales.reduce((sum, sale) => sum + parseFloat(sale.orderValue), 0);
                  const roas = spend > 0 ? totalOrderValue / spend : 0;

                  return {
                    id: campaign.id,
                    name: campaign.name,
                    impressions,
                    clicks: outboundClicks,
                    ctr,
                    spend,
                    roas,
                  };
                })
            );
          }

          // Create lookup map for spend values
          const adSpendMap = new Map(adsWithPerformance.map(ad => [ad.id, ad.spend]));

          return {
            topPerformers: topPerformers.map(p => ({
              id: p.adId,
              name: p.adName,
              imageUrl: p.imageUrl,
              roas: p.metrics.roasOrderVolume,
              cpl: p.metrics.costPerLead,
              ctr: p.metrics.outboundCtr,
              spend: adSpendMap.get(p.adId) || 0,
            })),
            topFlops: topFlops.map(p => ({
              id: p.adId,
              name: p.adName,
              imageUrl: p.imageUrl,
              roas: p.metrics.roasOrderVolume,
              cpl: p.metrics.costPerLead,
              ctr: p.metrics.outboundCtr,
              spend: adSpendMap.get(p.adId) || 0,
            })),
            campaignOverview,
          };
        } catch (error) {
          console.error("Error fetching performance data:", error);
          throw error;
        }
      }),
  }),

  // ============================================
  // Ad Sets (Anzeigengruppen)
  // ============================================
  adsets: router({
    listByCampaign: protectedProcedure
      .input(z.object({
        campaignId: z.string(),
        datePreset: z.enum(["today", "last_7d", "last_30d", "this_month", "last_90d"]).optional(),
        timeRange: z.object({
          since: z.string(),
          until: z.string(),
        }).optional(),
      }))
      .query(async ({ input }) => {
        try {
          const adsets = await getCampaignAdSets(input.campaignId, {
            datePreset: input.datePreset,
            timeRange: input.timeRange,
          });

          // Calculate date range for sales filtering
          let startDate: Date | undefined;
          let endDate: Date | undefined;
          if (input.timeRange) {
            startDate = new Date(input.timeRange.since);
            endDate = new Date(input.timeRange.until);
          }

          // Transform Meta API response with same metrics as campaigns
          return await Promise.all(adsets.map(async adset => {
            const insights = adset.insights?.data?.[0];
            
            // Extract leads from actions array
            let leadsFromMeta = 0;
            if (insights?.actions) {
              const leadAction = insights.actions.find(
                (action: any) => action.action_type === "lead" || 
                         action.action_type === "offsite_conversion.fb_pixel_lead"
              );
              leadsFromMeta = leadAction ? parseInt(leadAction.value) : 0;
            }

            // Check for manual lead correction
            const leadCorrection = await db.getLeadCorrectionByEntity({ metaAdSetId: adset.id });
            const leads = leadCorrection ? leadCorrection.correctedLeadCount : leadsFromMeta;
            const hasLeadCorrection = !!leadCorrection;

            // Extract outbound clicks
            let outboundClicks = 0;
            if (insights?.outbound_clicks) {
              const outboundClickAction = insights.outbound_clicks.find(
                (action: any) => action.action_type === "outbound_click"
              );
              outboundClicks = outboundClickAction ? parseInt(outboundClickAction.value) : 0;
            }

            // Extract cost per outbound click
            let costPerOutboundClick = 0;
            if (insights?.cost_per_outbound_click) {
              const costAction = insights.cost_per_outbound_click.find(
                (action: any) => action.action_type === "outbound_click"
              );
              costPerOutboundClick = costAction ? parseFloat(costAction.value) : 0;
            }

            const impressions = insights ? parseInt(insights.impressions) : 0;
            const spend = insights ? parseFloat(insights.spend) : 0;
            const cpm = insights ? parseFloat(insights.cpm) : 0;
            
            // Calculate derived metrics
            const costPerLead = leads > 0 ? spend / leads : 0;
            const outboundCtr = impressions > 0 ? (outboundClicks / impressions) * 100 : 0;
            const conversionRate = outboundClicks > 0 ? (leads / outboundClicks) * 100 : 0;

            // Fetch sales for ROAS calculation
            const sales = await db.getSalesByEntity({
              metaAdSetId: adset.id,
              startDate,
              endDate,
            });

            // Calculate ROAS metrics
            const totalOrderValue = sales.reduce((sum, sale) => sum + parseFloat(sale.orderValue), 0);
            const totalCashCollect = sales.reduce((sum, sale) => sum + parseFloat(sale.cashCollect), 0);
            const roasOrderVolume = spend > 0 ? totalOrderValue / spend : 0;
            const roasCashCollect = spend > 0 ? totalCashCollect / spend : 0;

            return {
              id: adset.id,
              name: adset.name,
              status: adset.status,
              impressions,
              spend,
              leads,
              leadsFromMeta,
              hasLeadCorrection,
              costPerLead,
              cpm,
              outboundClicks,
              outboundCtr,
              costPerOutboundClick,
              conversionRate,
              totalOrderValue,
              totalCashCollect,
              roasOrderVolume,
              roasCashCollect,
              salesCount: sales.length,
            };
          }));
        } catch (error) {
          console.error("Error fetching ad sets:", error);
          throw error;
        }
      }),
  }),

  // ============================================
  // Ads (Werbeanzeigen)
  // ============================================
  ads: router({
    listByAdSet: protectedProcedure
      .input(z.object({
        adSetId: z.string(),
        datePreset: z.enum(["today", "last_7d", "last_30d", "this_month", "last_90d"]).optional(),
        timeRange: z.object({
          since: z.string(),
          until: z.string(),
        }).optional(),
      }))
      .query(async ({ input }) => {
        try {
          const ads = await getAdSetAds(input.adSetId, {
            datePreset: input.datePreset,
            timeRange: input.timeRange,
          });

          // Calculate date range for sales filtering
          let startDate: Date | undefined;
          let endDate: Date | undefined;
          if (input.timeRange) {
            startDate = new Date(input.timeRange.since);
            endDate = new Date(input.timeRange.until);
          }

          // Transform Meta API response with same metrics as campaigns
          return await Promise.all(ads.map(async ad => {
            const insights = ad.insights?.data?.[0];
            
            // Extract leads from actions array
            let leadsFromMeta = 0;
            if (insights?.actions) {
              const leadAction = insights.actions.find(
                (action: any) => action.action_type === "lead" || 
                         action.action_type === "offsite_conversion.fb_pixel_lead"
              );
              leadsFromMeta = leadAction ? parseInt(leadAction.value) : 0;
            }

            // Check for manual lead correction
            const leadCorrection = await db.getLeadCorrectionByEntity({ metaAdId: ad.id });
            const leads = leadCorrection ? leadCorrection.correctedLeadCount : leadsFromMeta;
            const hasLeadCorrection = !!leadCorrection;

            // Extract outbound clicks
            let outboundClicks = 0;
            if (insights?.outbound_clicks) {
              const outboundClickAction = insights.outbound_clicks.find(
                (action: any) => action.action_type === "outbound_click"
              );
              outboundClicks = outboundClickAction ? parseInt(outboundClickAction.value) : 0;
            }

            // Extract cost per outbound click
            let costPerOutboundClick = 0;
            if (insights?.cost_per_outbound_click) {
              const costAction = insights.cost_per_outbound_click.find(
                (action: any) => action.action_type === "outbound_click"
              );
              costPerOutboundClick = costAction ? parseFloat(costAction.value) : 0;
            }

            const impressions = insights ? parseInt(insights.impressions) : 0;
            const spend = insights ? parseFloat(insights.spend) : 0;
            const cpm = insights ? parseFloat(insights.cpm) : 0;
            
            // Calculate derived metrics
            const costPerLead = leads > 0 ? spend / leads : 0;
            const outboundCtr = impressions > 0 ? (outboundClicks / impressions) * 100 : 0;
            const conversionRate = outboundClicks > 0 ? (leads / outboundClicks) * 100 : 0;

            // Fetch sales for ROAS calculation
            const sales = await db.getSalesByEntity({
              metaAdId: ad.id,
              startDate,
              endDate,
            });

            // Calculate ROAS metrics
            const totalOrderValue = sales.reduce((sum, sale) => sum + parseFloat(sale.orderValue), 0);
            const totalCashCollect = sales.reduce((sum, sale) => sum + parseFloat(sale.cashCollect), 0);
            const roasOrderVolume = spend > 0 ? totalOrderValue / spend : 0;
            const roasCashCollect = spend > 0 ? totalCashCollect / spend : 0;

            // Extract image URL from creative
            const imageUrl = ad.creative?.thumbnail_url || ad.creative?.image_url || null;

            return {
              id: ad.id,
              name: ad.name,
              status: ad.status,
              imageUrl,
              impressions,
              spend,
              leads,
              leadsFromMeta,
              hasLeadCorrection,
              costPerLead,
              cpm,
              outboundClicks,
              outboundCtr,
              costPerOutboundClick,
              conversionRate,
              totalOrderValue,
              totalCashCollect,
              roasOrderVolume,
              roasCashCollect,
              salesCount: sales.length,
            };
          }));
        } catch (error) {
          console.error("Error fetching ads:", error);
          throw error;
        }
      }),
  }),

  // ============================================
  // Client Management
  // ============================================
  clients: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllClients();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getClientById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        companyName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createClient(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        companyName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateClient(id, { ...updates, updatedAt: new Date() });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteClient(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // Onboarding Data Management
  // ============================================
  onboarding: router({
    getByClientId: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getOnboardingDataByClientId(input.clientId);
      }),

    upsert: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        landingPageUrl: z.string().optional(),
        communicationGoal: z.string().optional(),
        conversionGoal: z.string().optional(),
        targetAudienceDescription: z.string().optional(),
        brandVoiceDescription: z.string().optional(),
        metaAdAccountId: z.string().optional(),
        metaAccessToken: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.upsertOnboardingData(input);
      }),
  }),

  // ============================================
  // Brand Assets Management
  // ============================================
  brandAssets: router({
    listByClientId: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBrandAssetsByClientId(input.clientId);
      }),

    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        assetType: z.enum(["logo", "image", "font", "color"]),
        name: z.string().optional(),
        value: z.string(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createBrandAsset(input);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBrandAsset(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // Creatives Management
  // ============================================
  creatives: router({
    listByClientId: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCreativesByClientId(input.clientId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCreativeById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        name: z.string().optional(),
        fabricJsonData: z.record(z.string(), z.unknown()).optional(),
        previewImageUrl: z.string().optional(),
        format: z.enum(["feed", "story"]),
        status: z.enum(["draft", "published", "archived"]).optional(),
        metaAdId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createCreative(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        fabricJsonData: z.record(z.string(), z.unknown()).optional(),
        previewImageUrl: z.string().optional(),
        format: z.enum(["feed", "story"]).optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        metaAdId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateCreative(id, { ...updates, updatedAt: new Date() });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCreative(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // Performance Data Management
  // ============================================
  performance: router({
    getByCreativeId: protectedProcedure
      .input(z.object({ creativeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPerformanceDataByCreativeId(input.creativeId);
      }),

    getByMetaAdId: protectedProcedure
      .input(z.object({ metaAdId: z.string() }))
      .query(async ({ input }) => {
        return await db.getPerformanceDataByMetaAdId(input.metaAdId);
      }),

    create: protectedProcedure
      .input(z.object({
        creativeId: z.number().optional(),
        metaAdId: z.string().optional(),
        metaCampaignId: z.string().optional(),
        campaignName: z.string().optional(),
        date: z.date(),
        impressions: z.number().optional(),
        spend: z.string().optional(),
        conversions: z.number().optional(),
        clicks: z.number().optional(),
        reach: z.number().optional(),
        ctr: z.string().optional(),
        cpc: z.string().optional(),
        cpm: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createPerformanceData(input);
      }),
  }),

  // ============================================
  // Projects Management
  // ============================================
  projects: router({
    listByClientId: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProjectsByClientId(input.clientId);
      }),

    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["active", "paused", "completed"]).optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createProject(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(["active", "paused", "completed"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateProject(id, { ...updates, updatedAt: new Date() });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProject(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // Meta API Integration
  // ============================================
  meta: router({
    fetchInsights: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        datePreset: z.string().optional(),
        level: z.enum(["account", "campaign", "adset", "ad"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const onboarding = await db.getOnboardingDataByClientId(input.clientId);
        if (!onboarding?.metaAdAccountId || !onboarding?.metaAccessToken) {
          throw new Error("Meta credentials not configured for this client");
        }

        return await metaApi.fetchMetaInsights({
          adAccountId: onboarding.metaAdAccountId,
          accessToken: onboarding.metaAccessToken,
          datePreset: input.datePreset,
          level: input.level,
        });
      }),

    fetchCampaignInsights: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        campaignNames: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        const onboarding = await db.getOnboardingDataByClientId(input.clientId);
        if (!onboarding?.metaAdAccountId || !onboarding?.metaAccessToken) {
          throw new Error("Meta credentials not configured for this client");
        }

        return await metaApi.fetchCampaignInsights(
          onboarding.metaAdAccountId,
          onboarding.metaAccessToken,
          input.campaignNames
        );
      }),
  }),

  // ============================================
  // Sales Tracking
  // ============================================
  sales: router({
    create: protectedProcedure
      .input(z.object({
        metaCampaignId: z.string().optional(),
        metaAdSetId: z.string().optional(),
        metaAdId: z.string().optional(),
        orderValue: z.number(),
        cashCollect: z.number(),
        completionDate: z.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Ensure at least one entity ID is provided
        if (!input.metaCampaignId && !input.metaAdSetId && !input.metaAdId) {
          throw new Error("At least one entity ID (campaign, ad set, or ad) must be provided");
        }

        // Auto-populate parent entity IDs for cascading
        let metaCampaignId = input.metaCampaignId;
        let metaAdSetId = input.metaAdSetId;
        let metaAdId = input.metaAdId;

        // If only ad ID is provided, fetch ad set and campaign IDs
        if (metaAdId && !metaAdSetId) {
          try {
            const { getAdDetails } = await import('./meta-api');
            const adDetails = await getAdDetails(metaAdId);
            metaAdSetId = adDetails.adset_id;
            metaCampaignId = adDetails.campaign_id;
          } catch (error) {
            console.warn('Failed to fetch ad details for cascading:', error);
          }
        }

        // If only ad set ID is provided, fetch campaign ID
        if (metaAdSetId && !metaCampaignId) {
          try {
            const { getAdSetDetails } = await import('./meta-api');
            const adSetDetails = await getAdSetDetails(metaAdSetId);
            metaCampaignId = adSetDetails.campaign_id;
          } catch (error) {
            console.warn('Failed to fetch ad set details for cascading:', error);
          }
        }

        // Convert numbers to strings for decimal fields
        const saleData = {
          ...input,
          metaCampaignId,
          metaAdSetId,
          metaAdId,
          orderValue: input.orderValue.toString(),
          cashCollect: input.cashCollect.toString(),
        };
        return await db.createSale(saleData);
      }),

    listByEntity: protectedProcedure
      .input(z.object({
        metaCampaignId: z.string().optional(),
        metaAdSetId: z.string().optional(),
        metaAdId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getSalesByEntity(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        orderValue: z.number().optional(),
        cashCollect: z.number().optional(),
        completionDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, orderValue, cashCollect, ...rest } = input;
        const updates: any = { ...rest, updatedAt: new Date() };
        if (orderValue !== undefined) updates.orderValue = orderValue.toString();
        if (cashCollect !== undefined) updates.cashCollect = cashCollect.toString();
        await db.updateSale(id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSale(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // Lead Corrections
  // ============================================
  leadCorrections: router({
    upsert: protectedProcedure
      .input(z.object({
        metaCampaignId: z.string().optional(),
        metaAdSetId: z.string().optional(),
        metaAdId: z.string().optional(),
        correctedLeadCount: z.number().int().min(0),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Ensure exactly one entity ID is provided
        const entityCount = [input.metaCampaignId, input.metaAdSetId, input.metaAdId].filter(Boolean).length;
        if (entityCount !== 1) {
          throw new Error("Exactly one entity ID (campaign, ad set, or ad) must be provided");
        }
        return await db.upsertLeadCorrection(input);
      }),

    getByEntity: protectedProcedure
      .input(z.object({
        metaCampaignId: z.string().optional(),
        metaAdSetId: z.string().optional(),
        metaAdId: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getLeadCorrectionByEntity(input);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLeadCorrection(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // AI Services
  // ============================================
  ai: router({
    generateImage: protectedProcedure
      .input(z.object({
        prompt: z.string(),
        aspectRatio: z.enum(["1:1", "16:9", "9:16", "3:4", "4:3"]).optional(),
        numOutputs: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await aiServices.generateImageWithFlux(input);
      }),

    generateAdText: protectedProcedure
      .input(z.object({
        communicationGoal: z.string(),
        targetAudience: z.string(),
        brandVoice: z.string().optional(),
        productDescription: z.string().optional(),
        format: z.enum(["feed", "story"]),
      }))
      .mutation(async ({ input }) => {
        return await aiServices.generateAdText(input);
      }),

    generateRecommendations: protectedProcedure
      .input(z.object({
        clientId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const onboarding = await db.getOnboardingDataByClientId(input.clientId);
        const creatives = await db.getCreativesByClientId(input.clientId);

        // Fetch performance data for all creatives
        const performanceHistory = [];
        for (const creative of creatives) {
          if (creative.metaAdId) {
            const perfData = await db.getPerformanceDataByMetaAdId(creative.metaAdId);
            if (perfData.length > 0) {
              const latest = perfData[0];
              performanceHistory.push({
                creativeName: creative.name || `Creative ${creative.id}`,
                impressions: latest.impressions || 0,
                clicks: latest.clicks || 0,
                conversions: latest.conversions || 0,
                spend: parseFloat(latest.spend || "0"),
              });
            }
          }
        }

        return await aiServices.generateCreativeRecommendations({
          clientId: input.clientId,
          performanceHistory,
          onboardingData: {
            communicationGoal: onboarding?.communicationGoal || undefined,
            targetAudience: onboarding?.targetAudienceDescription || undefined,
            brandVoice: onboarding?.brandVoiceDescription || undefined,
          },
        });
      }),

    // ============================================
    // Make.com Webhook Integration
    // ============================================
    
    // Trigger creative generation via Make.com webhook
    triggerCreativeGeneration: protectedProcedure
      .input(z.object({
        campaignId: z.string(),
        adSetId: z.string().optional(),
        landingPageUrl: z.string(),
        format: z.enum(['feed', 'story', 'reel']),
        count: z.number().min(1).max(10),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log('[triggerCreativeGeneration] Input:', input);
        const { randomUUID } = await import('crypto');
        const jobId = randomUUID();
        
        // Import necessary functions
        const { identifyWinningCreatives } = await import('./winning-creatives');
        const { getAdSetTargeting, getCampaignAdSets, getAdSetAds, extractImageUrl } = await import('./meta-api');
        const { getSalesData } = await import('./db');
        
        // Get winning ad data (top performer) - reuse logic from getWinningCreatives procedure
        let allAds = [];
        if (input.adSetId) {
          const ads = await getAdSetAds(input.adSetId, {});
          allAds = ads;
        } else {
          const adSets = await getCampaignAdSets(input.campaignId, {});
          for (const adSet of adSets) {
            const ads = await getAdSetAds(adSet.id, {});
            allAds.push(...ads);
          }
        }
        
        // Load sales data for ROAS calculation
        const salesData = await getSalesData();
        
        // Transform to performance data format
        const adsWithPerformance = allAds.map(ad => {
          const insights = ad.insights?.data?.[0];
          const spend = parseFloat(insights?.spend || '0');
          const impressions = parseInt(insights?.impressions || '0');
          const outboundClicks = insights?.outbound_clicks?.find((a: any) => a.action_type === 'outbound_click');
          const leads = insights?.actions?.find((a: any) => a.action_type === 'lead');
          
          const adSales = salesData.get(`ad:${ad.id}`);
          const roasOrderVolume = spend > 0 && adSales ? adSales.orderValue / spend : 0;
          const roasCashCollect = spend > 0 && adSales ? adSales.cashCollect / spend : 0;
          
          const outboundClickCount = parseInt(outboundClicks?.value || '0');
          const leadCount = parseInt(leads?.value || '0');
          const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
          const outboundCtr = impressions > 0 ? (outboundClickCount / impressions) * 100 : 0;
          const costPerOutboundClick = outboundClickCount > 0 ? spend / outboundClickCount : 0;
          const costPerLead = leadCount > 0 ? spend / leadCount : 0;
          
          return {
            id: ad.id,
            name: ad.name,
            roasOrderVolume,
            roasCashCollect,
            costPerLead,
            costPerOutboundClick,
            outboundCtr,
            cpm,
            spend,
            leads: leadCount,
            impressions,
            imageUrl: null, // Will be populated below
          };
        });
        
        // Identify top performer
        const winningAds = identifyWinningCreatives(adsWithPerformance, 1);
        const topAd = winningAds[0];
        
        // Get image URL for top ad
        if (topAd) {
          try {
            const creative = await import('./meta-api').then(m => m.getAdCreatives(topAd.adId));
            topAd.imageUrl = extractImageUrl(creative);
          } catch (error) {
            console.error('[triggerCreativeGeneration] Failed to fetch image:', error);
          }
        }
        
        // Get targeting data if adSetId provided
        let targeting = null;
        if (input.adSetId) {
          try {
            targeting = await getAdSetTargeting(input.adSetId);
          } catch (error) {
            console.error('[triggerCreativeGeneration] Failed to fetch targeting:', error);
          }
        }
        
        // Create job record in database
        console.log('[triggerCreativeGeneration] Creating job:', jobId);
        await db.createCreativeJob({
          jobId,
          userId: ctx.user.id,
          campaignId: input.campaignId,
          landingPageUrl: input.landingPageUrl,
          format: input.format,
          count: input.count,
          status: 'pending',
        });
        
        // Send webhook to Make.com
        const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;
        if (!makeWebhookUrl) {
          throw new Error('MAKE_WEBHOOK_URL not configured');
        }
        
        const appUrl = process.env.APP_URL || `https://${ctx.req.headers.host}`;
        
        // Prepare comprehensive webhook payload
        const webhookPayload = {
          jobId,
          userId: ctx.user.id,
          campaignId: input.campaignId,
          adSetId: input.adSetId,
          
          // Landing Page Data
          landingPageUrl: input.landingPageUrl,
          
          // Winning Ad Data (Top Performer)
          winningAd: topAd ? {
            id: topAd.adId,
            name: topAd.adName,
            imageUrl: topAd.imageUrl,
            metrics: {
              roasOrderVolume: topAd.metrics.roasOrderVolume,
              roasCashCollect: topAd.metrics.roasCashCollect,
              costPerLead: topAd.metrics.costPerLead,
              costPerOutboundClick: topAd.metrics.costPerOutboundClick,
              outboundCtr: topAd.metrics.outboundCtr,
              cpm: topAd.metrics.cpm,
            },
          } : null,
          
          // Targeting Data (Audience)
          targeting: targeting ? {
            ageMin: targeting.age_min,
            ageMax: targeting.age_max,
            genders: targeting.genders, // [1] = male, [2] = female
            geoLocations: targeting.geo_locations,
            interests: targeting.flexible_spec?.map((spec: any) => spec.interests || []).flat(),
            locales: targeting.locales,
          } : null,
          
          // Generation Parameters
          format: input.format,
          count: input.count,
          
          // Callback URL
          callbackUrl: `${appUrl}/api/trpc/ai.receiveCreatives`,
        };
        
        try {
          await fetch(makeWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookPayload),
          });
          
          // Update status to processing
          await db.updateCreativeJobStatus(jobId, 'processing');
          
          return { jobId, status: 'processing' };
        } catch (error) {
          console.error('[triggerCreativeGeneration] Error:', error);
          await db.updateCreativeJobStatus(jobId, 'failed', (error as Error).message);
          throw error;
        }
      }),
    
    // Callback endpoint for Make.com to send finished creatives
    receiveCreatives: publicProcedure
      .input(z.object({
        jobId: z.string(),
        creatives: z.array(z.object({
          url: z.string(),
          format: z.string(),
          headline: z.string().optional(),
          eyebrow: z.string().optional(),
          cta: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        // Update job with results
        await db.completeCreativeJob(input.jobId, {
          creatives: input.creatives,
        });
        
        return { success: true };
      }),
    
    // Poll job status (frontend checks if job is done)
    getJobStatus: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ input, ctx }) => {
        const job = await db.getCreativeJob(input.jobId);
        
        if (!job) {
          throw new Error('Job not found');
        }
        
        // Verify job belongs to user
        if (job.userId !== ctx.user.id) {
          throw new Error('Unauthorized');
        }
        
        return {
          jobId: job.jobId,
          status: job.status,
          result: job.result,
          errorMessage: job.errorMessage,
          createdAt: job.createdAt,
          completedAt: job.completedAt,
        };
      }),

    // ============================================
    // Legacy Creative Generation (Direct)
    // ============================================
    
    // Creative Generator V2 - 4-Step Workflow (Deep Analysis + Claude + Gemini)
    generateBatchCreativesV2: protectedProcedure
      .input(z.object({
        campaignId: z.string(),
        landingPageUrl: z.string(),
        formats: z.array(z.enum(['feed', 'story', 'reel'])),
        count: z.number().min(1).max(10),
      }))
      .mutation(async ({ input }) => {
        const { generateBatchCreativesV2 } = await import('./batch-creative-generator-v2');
        
        const results = await generateBatchCreativesV2({
          campaignId: input.campaignId,
          landingPageUrl: input.landingPageUrl,
          formats: input.formats,
          count: input.count,
        });
        
        return results;
      }),

    // Creative Generator - Generate batch creatives (OLD)
    generateBatchCreatives: protectedProcedure
      .input(z.object({
        campaignId: z.string(),
        format: z.enum(['feed', 'story', 'reel', 'all']),
        count: z.number().min(1).max(10),
        userDescription: z.string().optional(),
        manualLandingPage: z.string().optional(),
        adSetId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateBatchCreatives } = await import('./batch-creative-generator');
        
        const creatives = await generateBatchCreatives({
          campaignId: input.campaignId,
          format: input.format,
          count: input.count,
          userDescription: input.userDescription,
          manualLandingPage: input.manualLandingPage,
          adSetId: input.adSetId,
        });
        
        return creatives;
      }),

    // Performance Analytics - Get top/low performers
    getTopPerformers: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        const { getTopPerformers } = await import('./performance-analytics');
        return await getTopPerformers(input.limit || 10);
      }),
    
    getLowPerformers: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        const { getLowPerformers } = await import('./performance-analytics');
        return await getLowPerformers(input.limit || 10);
      }),
    
    getWinningPatterns: protectedProcedure
      .query(async () => {
        const { extractWinningPatterns } = await import('./performance-analytics');
        return await extractWinningPatterns();
      }),

    // Ad Copywriter - Generate professional ad copy from landing page
    generateAdCopy: protectedProcedure
      .input(z.object({
        landingPageUrl: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        const { scrapeLandingPage } = await import('./landingpage-scraper');
        const { generateAdCopy } = await import('./ad-copywriter');
        
        // Scrape landing page
        const landingPageData = await scrapeLandingPage(input.landingPageUrl);
        
        // Build content string from landing page data
        const content = [
          landingPageData.title && `Title: ${landingPageData.title}`,
          landingPageData.description && `Description: ${landingPageData.description}`,
          landingPageData.h1 && `H1: ${landingPageData.h1}`,
          landingPageData.h2 && `H2: ${landingPageData.h2}`,
          landingPageData.ctaText && `CTA: ${landingPageData.ctaText}`,
          landingPageData.ogDescription && `OG Description: ${landingPageData.ogDescription}`,
        ].filter(Boolean).join('\n\n');
        
        // Generate ad copy
        const adCopy = await generateAdCopy(content, input.landingPageUrl);
        
        return adCopy;
      }),

    // Creative Generator - Get landing page data from campaign
    getLandingPageFromCampaign: protectedProcedure
      .input(z.object({
        campaignId: z.string(),
      }))
      .query(async ({ input }) => {
        const { getAdCreatives, extractLandingPageUrl } = await import('./meta-api');
        const { scrapeLandingPage, getBestDescription, getBestTitle } = await import('./landingpage-scraper');
        const { getAdSetAds, getCampaignAdSets } = await import('./meta-api');
        
        // Get all ad sets from campaign
        const adSets = await getCampaignAdSets(input.campaignId);
        
        if (adSets.length === 0) {
          return { url: null, data: null, error: 'No ad sets found in campaign' };
        }
        
        // Collect all ads from all ad sets
        const allAds: any[] = [];
        for (const adSet of adSets) {
          try {
            const ads = await getAdSetAds(adSet.id);
            allAds.push(...ads);
          } catch (error) {
            console.error(`Error fetching ads for ad set ${adSet.id}:`, error);
          }
        }
        
        if (allAds.length === 0) {
          return { url: null, data: null, error: 'No ads found in campaign' };
        }
        
        // Extract landing page URLs from all ads
        const urlCounts = new Map<string, number>();
        
        for (const ad of allAds) {
          try {
            const creative = await getAdCreatives(ad.id);
            if (creative && Object.keys(creative).length > 0) {
              const url = extractLandingPageUrl(creative);
              if (url) {
                urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
              }
            }
          } catch (error) {
            console.error(`Error fetching creative for ad ${ad.id}:`, error);
          }
        }
        
        if (urlCounts.size === 0) {
          return { url: null, data: null, error: 'No landing page URL found in any ad creative' };
        }
        
        // Find the most common URL (in case there are multiple)
        let mostCommonUrl = '';
        let maxCount = 0;
        for (const [url, count] of Array.from(urlCounts.entries())) {
          if (count > maxCount) {
            mostCommonUrl = url;
            maxCount = count;
          }
        }
        
        // Scrape landing page
        const scrapedData = await scrapeLandingPage(mostCommonUrl);
        
        return {
          url: mostCommonUrl,
          data: {
            title: getBestTitle(scrapedData),
            description: getBestDescription(scrapedData),
            ogImage: scrapedData.ogImage,
          },
          error: scrapedData.error,
          urlsFound: urlCounts.size,
          totalAdsChecked: allAds.length,
        };
      }),

    // Creative Generator - Get audience targeting from ad set
    getAudienceTargeting: protectedProcedure
      .input(z.object({
        adSetId: z.string(),
      }))
      .query(async ({ input }) => {
        const { getAdSetTargeting } = await import('./meta-api');
        const targeting = await getAdSetTargeting(input.adSetId);
        return targeting;
      }),

    // DEBUG: Get raw creative data from first ad
    debugGetCreativeData: protectedProcedure
      .input(z.object({
        campaignId: z.string(),
      }))
      .query(async ({ input }) => {
        const { getAdCreatives } = await import('./meta-api');
        const { getAdSetAds, getCampaignAdSets } = await import('./meta-api');
        
        // Get all ad sets from campaign
        const adSets = await getCampaignAdSets(input.campaignId);
        
        if (adSets.length === 0) {
          return { error: 'No ad sets found' };
        }
        
        // Get ads from first ad set
        const ads = await getAdSetAds(adSets[0].id);
        
        if (ads.length === 0) {
          return { error: 'No ads found' };
        }
        
        // Get creative from first ad
        const creative = await getAdCreatives(ads[0].id);
        
        return {
          adId: ads[0].id,
          adName: ads[0].name,
          creative: creative,
          creativeKeys: Object.keys(creative || {}),
        };
      }),

    // Creative Generator - Get winning creatives from campaign
    getWinningCreatives: protectedProcedure
      .input(z.object({
        campaignId: z.string(),
        adSetId: z.string().optional(),
        datePreset: z.enum(["today", "last_7d", "last_30d", "this_month", "last_90d"]).optional(),
        timeRange: z.object({
          since: z.string(),
          until: z.string(),
        }).optional(),
      }))
      .query(async ({ input }) => {
        const { identifyWinningCreatives, getWinningCreativeInsights } = await import('./winning-creatives');
        const { getCampaignAdSets, getAdSetAds, getAdCreatives, extractImageUrl } = await import('./meta-api');
        const { getSalesData } = await import('./db');
        
        // Get all ads from campaign or specific ad set
        let allAds = [];
        if (input.adSetId) {
          // Filter by specific ad set
          const ads = await getAdSetAds(input.adSetId, {
            datePreset: input.datePreset,
            timeRange: input.timeRange,
          });
          allAds = ads;
        } else {
          // Get all ads from all ad sets in campaign
          const adSets = await getCampaignAdSets(input.campaignId, {
            datePreset: input.datePreset,
            timeRange: input.timeRange,
          });
          
          for (const adSet of adSets) {
            const ads = await getAdSetAds(adSet.id, {
              datePreset: input.datePreset,
              timeRange: input.timeRange,
            });
            allAds.push(...ads);
          }
        }
        
        // Load sales data for ROAS calculation
        const salesData = await getSalesData();
        
        // Transform to performance data format
        const adsWithPerformance = allAds.map(ad => {
          const insights = ad.insights?.data?.[0];
          const spend = parseFloat(insights?.spend || '0');
          const impressions = parseInt(insights?.impressions || '0');
          const outboundClicks = insights?.outbound_clicks?.find(a => a.action_type === 'outbound_click');
          const leads = insights?.actions?.find(a => a.action_type === 'lead');
          
          // Get ROAS from manually entered sales data
          const adSales = salesData.get(`ad:${ad.id}`);
          const roasOrderVolume = spend > 0 && adSales ? adSales.orderValue / spend : 0;
          const roasCashCollect = spend > 0 && adSales ? adSales.cashCollect / spend : 0;
          
          const outboundClickCount = parseInt(outboundClicks?.value || '0');
          const leadCount = parseInt(leads?.value || '0');
          const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
          const outboundCtr = impressions > 0 ? (outboundClickCount / impressions) * 100 : 0;
          const costPerOutboundClick = outboundClickCount > 0 ? spend / outboundClickCount : 0;
          const costPerLead = leadCount > 0 ? spend / leadCount : 0;
          
          return {
            id: ad.id,
            name: ad.name,
            roasOrderVolume,
            roasCashCollect,
            costPerLead,
            costPerOutboundClick,
            outboundCtr,
            cpm,
            spend,
            leads: leadCount,
            impressions,
          };
        });
        
        const winners = identifyWinningCreatives(adsWithPerformance, 5);
        
        // Fetch image URLs for winning ads
        const winnersWithImages = await Promise.all(
          winners.map(async (winner) => {
            try {
              const creative = await getAdCreatives(winner.adId);
              const imageUrl = extractImageUrl(creative);
              return { ...winner, imageUrl };
            } catch (error) {
              console.error(`Failed to fetch image for ad ${winner.adId}:`, error);
              return { ...winner, imageUrl: null };
            }
          })
        );
        
        const insights = getWinningCreativeInsights(winnersWithImages);
        
        return { winners: winnersWithImages, insights };
      }),

    // Creative Generator - Extract design system from winning creative
    extractDesignSystem: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { extractDesignSystem } = await import('./creative-analyzer');
        const designSystem = await extractDesignSystem(input.imageUrl);
        return designSystem;
      }),

    // Creative Generator - Generate style-aware prompt
    generateStyleAwarePrompt: protectedProcedure
      .input(z.object({
        campaignId: z.string(),
        userDescription: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { extractDesignSystem, generateStyleAwarePrompt } = await import('./creative-analyzer');
        const { getAdCreatives, extractImageUrl, getCampaignAdSets, getAdSetAds } = await import('./meta-api');
        const { scrapeLandingPage } = await import('./landingpage-scraper');
        const { identifyWinningCreatives } = await import('./winning-creatives');
        
        // Get winning creative
        const adSets = await getCampaignAdSets(input.campaignId);
        const allAds = [];
        for (const adSet of adSets) {
          const ads = await getAdSetAds(adSet.id);
          allAds.push(...ads);
        }
        
        const adsWithPerformance = allAds.map(ad => {
          const insights = ad.insights?.data?.[0];
          const spend = parseFloat(insights?.spend || '0');
          const impressions = parseInt(insights?.impressions || '0');
          const outboundClicks = insights?.outbound_clicks?.find(a => a.action_type === 'outbound_click');
          const leads = insights?.actions?.find(a => a.action_type === 'lead');
          
          return {
            id: ad.id,
            name: ad.name,
            roasOrderVolume: 0,
            roasCashCollect: 0,
            costPerLead: leads ? spend / parseInt(leads.value) : 0,
            costPerOutboundClick: outboundClicks ? spend / parseInt(outboundClicks.value) : 0,
            outboundCtr: impressions > 0 ? (parseInt(outboundClicks?.value || '0') / impressions) * 100 : 0,
            cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
            spend,
            leads: leads ? parseInt(leads.value) : 0,
            impressions,
          };
        });
        
        const winners = identifyWinningCreatives(adsWithPerformance, 1);
        if (winners.length === 0) {
          throw new Error('No winning creatives found');
        }
        
        // Get image URL and extract design system
        const creative = await getAdCreatives(winners[0].adId);
        const imageUrl = extractImageUrl(creative);
        
        if (!imageUrl) {
          throw new Error('No image found for winning creative');
        }
        
        const designSystem = await extractDesignSystem(imageUrl);
        
        // Get landing page data
        const landingPageUrl = await import('./meta-api').then(m => m.extractLandingPageUrl(creative));
        const landingPageData = landingPageUrl ? await scrapeLandingPage(landingPageUrl) : {
          url: '',
          title: '',
          description: '',
          h1: '',
          h2: '',
          ctaText: '',
          heroImages: [],
          ogTitle: null,
          ogDescription: null,
          ogImage: null,
          keywords: null,
          bodyText: null,
          error: undefined,
        };
        
        // Generate style-aware prompt
        const prompt = await generateStyleAwarePrompt(
          designSystem,
          landingPageData,
          input.userDescription
        );
        
        return { prompt, designSystem, imageUrl };
      }),

    // Creative Generator - Generate headline variations
    generateHeadlineVariations: protectedProcedure
      .input(z.object({
        originalHeadline: z.string(),
        campaignId: z.string(),
        count: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateHeadlineVariations } = await import('./creative-analyzer');
        const { extractLandingPageUrl, getAdCreatives, getCampaignAdSets, getAdSetAds } = await import('./meta-api');
        const { scrapeLandingPage } = await import('./landingpage-scraper');
        
        // Get landing page from campaign
        const adSets = await getCampaignAdSets(input.campaignId);
        const allAds = [];
        for (const adSet of adSets) {
          const ads = await getAdSetAds(adSet.id);
          allAds.push(...ads);
        }
        
        if (allAds.length === 0) {
          throw new Error('No ads found in campaign');
        }
        
        const creative = await getAdCreatives(allAds[0].id);
        const landingPageUrl = extractLandingPageUrl(creative);
        const landingPageData = landingPageUrl ? await scrapeLandingPage(landingPageUrl) : {
          url: '',
          title: '',
          description: '',
          h1: '',
          h2: '',
          ctaText: '',
          heroImages: [],
          ogTitle: null,
          ogDescription: null,
          ogImage: null,
          keywords: null,
          bodyText: null,
          error: undefined,
        };
        
        const variations = await generateHeadlineVariations(
          input.originalHeadline,
          landingPageData,
          input.count
        );
        
        return variations;
      }),

    // Creative Generator - Add text overlay to image
    addTextOverlay: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
        eyebrowText: z.string().optional(),
        headlineText: z.string(),
        ctaText: z.string().optional(),
        designSystem: z.object({
          colorPalette: z.array(z.string()),
          textLayout: z.object({
            eyebrowPosition: z.string(),
            headlinePosition: z.string(),
            ctaPosition: z.string(),
          }),
          typography: z.object({
            eyebrowStyle: z.string(),
            headlineStyle: z.string(),
            ctaStyle: z.string(),
          }),
          visualStyle: z.string(),
          backgroundStyle: z.string(),
        }),
      }))
      .mutation(async ({ input }) => {
        const { addTextOverlay } = await import('./text-overlay');
        const { storagePut } = await import('./storage');
        
        // Add text overlay
        const imageBuffer = await addTextOverlay(input.imageUrl, {
          eyebrowText: input.eyebrowText,
          headlineText: input.headlineText,
          ctaText: input.ctaText,
          designSystem: input.designSystem,
        });
        
        // Upload to S3
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `creatives/final-${randomSuffix}.png`;
        const { url } = await storagePut(fileKey, imageBuffer, 'image/png');
        
        return { url };
      }),

    // Creative Generator - Generate contextual prompt
    generateCreativePrompt: protectedProcedure
      .input(z.object({
        campaignId: z.string(),
        userDescription: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { analyzeWinningCreatives, generateContextualPrompt } = await import('./creative-analyzer');
        const { getAdCreatives, extractImageUrl, getCampaignAdSets, getAdSetAds } = await import('./meta-api');
        const { scrapeLandingPage, getBestTitle } = await import('./landingpage-scraper');
        
        // Get winning ads images
        const adSets = await getCampaignAdSets(input.campaignId);
        const allAds = [];
        for (const adSet of adSets) {
          const ads = await getAdSetAds(adSet.id);
          allAds.push(...ads);
        }
        
        // Get top 3 ad images
        const imageUrls: string[] = [];
        for (const ad of allAds.slice(0, 3)) {
          try {
            const creative = await getAdCreatives(ad.id);
            const imageUrl = extractImageUrl(creative);
            if (imageUrl) imageUrls.push(imageUrl);
          } catch (error) {
            console.error(`Failed to fetch image for ad ${ad.id}:`, error);
          }
        }
        
        // Analyze winning creatives
        const creativeAnalysis = await analyzeWinningCreatives(imageUrls);
        
        // Get landing page data (use first ad's URL)
        let landingPageData = null;
        if (allAds.length > 0) {
          try {
            const creative = await getAdCreatives(allAds[0].id);
            const { extractLandingPageUrl } = await import('./meta-api');
            const url = extractLandingPageUrl(creative);
            if (url) {
              landingPageData = await scrapeLandingPage(url);
            }
          } catch (error) {
            console.error('Failed to scrape landing page:', error);
          }
        }
        
        if (!landingPageData) {
          throw new Error('Could not extract landing page data');
        }
        
        // Generate contextual prompt
        const prompt = await generateContextualPrompt(
          landingPageData,
          creativeAnalysis,
          input.userDescription
        );
        
        return {
          prompt,
          analysis: creativeAnalysis,
          landingPage: {
            h1: landingPageData.h1,
            h2: landingPageData.h2,
            ctaText: landingPageData.ctaText,
          },
        };
      }),
  }),

  // ============================================
  // Ad Copies (Werbetexte)
  // ============================================
  adCopies: router({
    create: protectedProcedure
      .input(z.object({
        landingPageUrl: z.string(),
        shortText: z.string(),
        longText: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const adCopy = await db.createAdCopy({
          userId: ctx.user.id,
          landingPageUrl: input.landingPageUrl,
          shortText: input.shortText,
          longText: input.longText,
        });
        return adCopy;
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        const adCopies = await db.getAdCopiesByUserId(ctx.user.id);
        return adCopies;
      }),
  }),
});

export type AppRouter = typeof appRouter;
