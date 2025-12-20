CREATE TABLE `brand_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`assetType` enum('logo','image','font','color') NOT NULL,
	`name` varchar(255),
	`value` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brand_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`companyName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creatives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`name` varchar(255),
	`fabricJsonData` json,
	`previewImageUrl` text,
	`format` enum('feed','story') NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`metaAdId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creatives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`landingPageUrl` text,
	`communicationGoal` text,
	`conversionGoal` text,
	`targetAudienceDescription` text,
	`brandVoiceDescription` text,
	`metaAdAccountId` varchar(255),
	`metaAccessToken` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creativeId` int,
	`metaAdId` varchar(255),
	`metaCampaignId` varchar(255),
	`campaignName` varchar(255),
	`date` timestamp NOT NULL,
	`impressions` int DEFAULT 0,
	`spend` decimal(10,2) DEFAULT '0',
	`conversions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`reach` int DEFAULT 0,
	`ctr` decimal(5,2),
	`cpc` decimal(10,2),
	`cpm` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performance_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('active','paused','completed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `brand_assets` ADD CONSTRAINT `brand_assets_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creatives` ADD CONSTRAINT `creatives_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `onboarding_data` ADD CONSTRAINT `onboarding_data_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `performance_data` ADD CONSTRAINT `performance_data_creativeId_creatives_id_fk` FOREIGN KEY (`creativeId`) REFERENCES `creatives`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;