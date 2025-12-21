ALTER TABLE `creatives` MODIFY COLUMN `format` enum('feed','story','reel') NOT NULL;--> statement-breakpoint
ALTER TABLE `creatives` ADD `campaignId` varchar(255);--> statement-breakpoint
ALTER TABLE `creatives` ADD `imageUrl` text;--> statement-breakpoint
ALTER TABLE `creatives` ADD `headline` text;--> statement-breakpoint
ALTER TABLE `creatives` ADD `eyebrowText` text;--> statement-breakpoint
ALTER TABLE `creatives` ADD `ctaText` text;