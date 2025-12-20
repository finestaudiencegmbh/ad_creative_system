import { eq, desc, and, gte, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  clients,
  InsertClient,
  Client,
  onboardingData,
  InsertOnboardingData,
  OnboardingData,
  brandAssets,
  InsertBrandAsset,
  BrandAsset,
  creatives,
  InsertCreative,
  Creative,
  performanceData,
  InsertPerformanceData,
  PerformanceData,
  projects,
  InsertProject,
  Project,
  sales,
  InsertSale,
  Sale,
  leadCorrections,
  InsertLeadCorrection,
  LeadCorrection,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// User Management
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// Client Management
// ============================================

export async function createClient(client: InsertClient): Promise<Client> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clients).values(client);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(clients).where(eq(clients.id, insertedId)).limit(1);
  if (!inserted[0]) throw new Error("Failed to retrieve inserted client");
  
  return inserted[0];
}

export async function getAllClients(): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function getClientById(id: number): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function updateClient(id: number, updates: Partial<InsertClient>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(clients).set(updates).where(eq(clients.id, id));
}

export async function deleteClient(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(clients).where(eq(clients.id, id));
}

// ============================================
// Onboarding Data Management
// ============================================

export async function upsertOnboardingData(data: InsertOnboardingData): Promise<OnboardingData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(onboardingData).where(eq(onboardingData.clientId, data.clientId)).limit(1);

  if (existing[0]) {
    await db.update(onboardingData).set(data).where(eq(onboardingData.clientId, data.clientId));
    const updated = await db.select().from(onboardingData).where(eq(onboardingData.clientId, data.clientId)).limit(1);
    if (!updated[0]) throw new Error("Failed to retrieve updated onboarding data");
    return updated[0];
  } else {
    const result = await db.insert(onboardingData).values(data);
    const insertedId = Number(result[0].insertId);
    const inserted = await db.select().from(onboardingData).where(eq(onboardingData.id, insertedId)).limit(1);
    if (!inserted[0]) throw new Error("Failed to retrieve inserted onboarding data");
    return inserted[0];
  }
}

export async function getOnboardingDataByClientId(clientId: number): Promise<OnboardingData | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(onboardingData).where(eq(onboardingData.clientId, clientId)).limit(1);
  return result[0];
}

// ============================================
// Brand Assets Management
// ============================================

export async function createBrandAsset(asset: InsertBrandAsset): Promise<BrandAsset> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(brandAssets).values(asset);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(brandAssets).where(eq(brandAssets.id, insertedId)).limit(1);
  if (!inserted[0]) throw new Error("Failed to retrieve inserted brand asset");
  
  return inserted[0];
}

export async function getBrandAssetsByClientId(clientId: number): Promise<BrandAsset[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(brandAssets).where(eq(brandAssets.clientId, clientId)).orderBy(desc(brandAssets.createdAt));
}

export async function deleteBrandAsset(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(brandAssets).where(eq(brandAssets.id, id));
}

// ============================================
// Creatives Management
// ============================================

export async function createCreative(creative: InsertCreative): Promise<Creative> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(creatives).values(creative);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(creatives).where(eq(creatives.id, insertedId)).limit(1);
  if (!inserted[0]) throw new Error("Failed to retrieve inserted creative");
  
  return inserted[0];
}

export async function getCreativesByClientId(clientId: number): Promise<Creative[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(creatives).where(eq(creatives.clientId, clientId)).orderBy(desc(creatives.createdAt));
}

export async function getCreativeById(id: number): Promise<Creative | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(creatives).where(eq(creatives.id, id)).limit(1);
  return result[0];
}

export async function updateCreative(id: number, updates: Partial<InsertCreative>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(creatives).set(updates).where(eq(creatives.id, id));
}

export async function deleteCreative(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(creatives).where(eq(creatives.id, id));
}

// ============================================
// Performance Data Management
// ============================================

export async function createPerformanceData(data: InsertPerformanceData): Promise<PerformanceData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(performanceData).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(performanceData).where(eq(performanceData.id, insertedId)).limit(1);
  if (!inserted[0]) throw new Error("Failed to retrieve inserted performance data");
  
  return inserted[0];
}

export async function getPerformanceDataByCreativeId(creativeId: number): Promise<PerformanceData[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(performanceData).where(eq(performanceData.creativeId, creativeId)).orderBy(desc(performanceData.date));
}

export async function getPerformanceDataByMetaAdId(metaAdId: string): Promise<PerformanceData[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(performanceData).where(eq(performanceData.metaAdId, metaAdId)).orderBy(desc(performanceData.date));
}

// ============================================
// Projects Management
// ============================================

export async function createProject(project: InsertProject): Promise<Project> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values(project);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(projects).where(eq(projects.id, insertedId)).limit(1);
  if (!inserted[0]) throw new Error("Failed to retrieve inserted project");
  
  return inserted[0];
}

export async function getProjectsByClientId(clientId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(projects).where(eq(projects.clientId, clientId)).orderBy(desc(projects.createdAt));
}

export async function updateProject(id: number, updates: Partial<InsertProject>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set(updates).where(eq(projects.id, id));
}

export async function deleteProject(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projects).where(eq(projects.id, id));
}

// ============================================
// Sales Management
// ============================================

export async function createSale(sale: InsertSale): Promise<Sale> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(sales).values(sale);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(sales).where(eq(sales.id, insertedId)).limit(1);
  if (!inserted[0]) throw new Error("Failed to retrieve inserted sale");
  
  return inserted[0];
}

export async function getSalesByEntity(params: {
  metaCampaignId?: string;
  metaAdSetId?: string;
  metaAdId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<Sale[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  // Entity filters (at least one must match)
  const entityConditions = [];
  if (params.metaCampaignId) {
    entityConditions.push(eq(sales.metaCampaignId, params.metaCampaignId));
  }
  if (params.metaAdSetId) {
    entityConditions.push(eq(sales.metaAdSetId, params.metaAdSetId));
  }
  if (params.metaAdId) {
    entityConditions.push(eq(sales.metaAdId, params.metaAdId));
  }

  if (entityConditions.length > 0) {
    conditions.push(or(...entityConditions));
  }

  // Date range filters
  if (params.startDate) {
    conditions.push(gte(sales.completionDate, params.startDate));
  }
  if (params.endDate) {
    conditions.push(lte(sales.completionDate, params.endDate));
  }

  if (conditions.length === 0) {
    return await db.select().from(sales).orderBy(desc(sales.completionDate));
  }

  return await db.select().from(sales).where(and(...conditions)).orderBy(desc(sales.completionDate));
}

export async function getSaleById(id: number): Promise<Sale | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(sales).where(eq(sales.id, id)).limit(1);
  return result[0];
}

export async function updateSale(id: number, updates: Partial<InsertSale>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(sales).set(updates).where(eq(sales.id, id));
}

export async function deleteSale(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(sales).where(eq(sales.id, id));
}

// ============================================
// Lead Corrections
// ============================================

export async function upsertLeadCorrection(correction: InsertLeadCorrection): Promise<LeadCorrection> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if a correction already exists for this entity
  const existing = await getLeadCorrectionByEntity({
    metaCampaignId: correction.metaCampaignId || undefined,
    metaAdSetId: correction.metaAdSetId || undefined,
    metaAdId: correction.metaAdId || undefined,
  });

  if (existing) {
    // Update existing correction
    await db.update(leadCorrections)
      .set({ 
        correctedLeadCount: correction.correctedLeadCount,
        notes: correction.notes || undefined,
        updatedAt: new Date(),
      })
      .where(eq(leadCorrections.id, existing.id));
    
    const updated = await db.select().from(leadCorrections).where(eq(leadCorrections.id, existing.id)).limit(1);
    return updated[0];
  } else {
    // Create new correction
    const result = await db.insert(leadCorrections).values(correction);
    const insertedId = Number(result[0].insertId);
    
    const inserted = await db.select().from(leadCorrections).where(eq(leadCorrections.id, insertedId)).limit(1);
    return inserted[0];
  }
}

export async function getLeadCorrectionByEntity(params: {
  metaCampaignId?: string;
  metaAdSetId?: string;
  metaAdId?: string;
}): Promise<LeadCorrection | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  let query = db.select().from(leadCorrections);

  if (params.metaCampaignId) {
    query = query.where(eq(leadCorrections.metaCampaignId, params.metaCampaignId)) as any;
  } else if (params.metaAdSetId) {
    query = query.where(eq(leadCorrections.metaAdSetId, params.metaAdSetId)) as any;
  } else if (params.metaAdId) {
    query = query.where(eq(leadCorrections.metaAdId, params.metaAdId)) as any;
  } else {
    return undefined;
  }

  const result = await query.limit(1);
  return result[0];
}

export async function deleteLeadCorrection(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(leadCorrections).where(eq(leadCorrections.id, id));
}
