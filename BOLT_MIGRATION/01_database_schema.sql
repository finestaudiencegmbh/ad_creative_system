-- ============================================
-- Ad Creative System - Database Schema Export
-- For Bolt.new Migration
-- ============================================

-- Users table (Auth)
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openId` VARCHAR(64) NOT NULL UNIQUE,
  `name` TEXT,
  `email` VARCHAR(320),
  `loginMethod` VARCHAR(64),
  `role` ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  `lastSignedIn` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Clients table (Multi-tenant)
CREATE TABLE `clients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `companyName` VARCHAR(255),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Onboarding data
CREATE TABLE `onboarding_data` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `clientId` INT NOT NULL,
  `landingPageUrl` TEXT,
  `communicationGoal` TEXT,
  `conversionGoal` TEXT,
  `targetAudienceDescription` TEXT,
  `brandVoiceDescription` TEXT,
  `metaAdAccountId` VARCHAR(255),
  `metaAccessToken` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE
);

-- Brand assets
CREATE TABLE `brand_assets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `clientId` INT NOT NULL,
  `assetType` ENUM('logo', 'image', 'font', 'color') NOT NULL,
  `name` VARCHAR(255),
  `value` TEXT NOT NULL,
  `metadata` JSON,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE
);

-- Creatives
CREATE TABLE `creatives` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `clientId` INT NOT NULL,
  `campaignId` VARCHAR(255),
  `name` VARCHAR(255),
  `fabricJsonData` JSON,
  `imageUrl` TEXT,
  `previewImageUrl` TEXT,
  `headline` TEXT,
  `eyebrowText` TEXT,
  `ctaText` TEXT,
  `format` ENUM('feed', 'story', 'reel') NOT NULL,
  `status` ENUM('draft', 'published', 'archived') DEFAULT 'draft' NOT NULL,
  `metaAdId` VARCHAR(255),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE
);

-- Performance data
CREATE TABLE `performance_data` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `clientId` INT NOT NULL,
  `metaAdId` VARCHAR(255),
  `metaCampaignId` VARCHAR(255),
  `campaignName` VARCHAR(255),
  `date` TIMESTAMP NOT NULL,
  `impressions` INT DEFAULT 0,
  `spend` DECIMAL(10, 2) DEFAULT 0,
  `conversions` INT DEFAULT 0,
  `clicks` INT DEFAULT 0,
  `reach` INT DEFAULT 0,
  `ctr` DECIMAL(5, 2),
  `cpc` DECIMAL(10, 2),
  `cpm` DECIMAL(10, 2),
  `costPerLead` DECIMAL(10, 2),
  `roas` DECIMAL(10, 2),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE
);

-- Projects
CREATE TABLE `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `clientId` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` ENUM('active', 'paused', 'completed') DEFAULT 'active' NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE
);

-- Sales (ROAS tracking)
CREATE TABLE `sales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `metaCampaignId` VARCHAR(255),
  `metaAdSetId` VARCHAR(255),
  `metaAdId` VARCHAR(255),
  `orderValue` DECIMAL(10, 2) NOT NULL,
  `cashCollect` DECIMAL(10, 2) NOT NULL,
  `completionDate` TIMESTAMP NOT NULL,
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Lead corrections
CREATE TABLE `lead_corrections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `metaCampaignId` VARCHAR(255),
  `metaAdSetId` VARCHAR(255),
  `metaAdId` VARCHAR(255),
  `correctedLeadCount` INT NOT NULL,
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Creative jobs (Make.com webhook integration)
CREATE TABLE `creative_jobs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `jobId` VARCHAR(255) NOT NULL UNIQUE,
  `userId` INT NOT NULL,
  `campaignId` VARCHAR(255) NOT NULL,
  `landingPageUrl` TEXT NOT NULL,
  `format` ENUM('feed', 'story', 'reel') NOT NULL,
  `count` INT NOT NULL,
  `status` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' NOT NULL,
  `result` JSON,
  `errorMessage` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `completedAt` TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Creative performance feedback
CREATE TABLE `creative_performance_feedback` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `creativeId` INT NOT NULL,
  `metaAdId` VARCHAR(255),
  `impressions` INT DEFAULT 0,
  `clicks` INT DEFAULT 0,
  `conversions` INT DEFAULT 0,
  `spend` DECIMAL(10, 2) DEFAULT 0,
  `ctr` DECIMAL(5, 2),
  `cpc` DECIMAL(10, 2),
  `cpm` DECIMAL(10, 2),
  `conversionRate` DECIMAL(5, 2),
  `roas` DECIMAL(10, 2),
  `visualElements` JSON,
  `colorPalette` JSON,
  `layoutType` VARCHAR(255),
  `textPlacement` VARCHAR(255),
  `imageStyle` VARCHAR(255),
  `performanceScore` FLOAT,
  `insights` TEXT,
  `recommendations` TEXT,
  `dateRecorded` TIMESTAMP NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- Indexes for performance
-- ============================================

CREATE INDEX idx_users_openid ON users(openId);
CREATE INDEX idx_sales_campaign ON sales(metaCampaignId);
CREATE INDEX idx_sales_adset ON sales(metaAdSetId);
CREATE INDEX idx_sales_ad ON sales(metaAdId);
CREATE INDEX idx_lead_corrections_campaign ON lead_corrections(metaCampaignId);
CREATE INDEX idx_lead_corrections_adset ON lead_corrections(metaAdSetId);
CREATE INDEX idx_lead_corrections_ad ON lead_corrections(metaAdId);
CREATE INDEX idx_creative_jobs_jobid ON creative_jobs(jobId);
CREATE INDEX idx_creative_jobs_userid ON creative_jobs(userId);
CREATE INDEX idx_performance_data_campaign ON performance_data(metaCampaignId);
CREATE INDEX idx_performance_data_ad ON performance_data(metaAdId);
