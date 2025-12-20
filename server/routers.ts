import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as metaApi from "./metaApi";
import * as aiServices from "./aiServices";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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
  }),
});

export type AppRouter = typeof appRouter;
