CREATE TABLE `lead_corrections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metaCampaignId` varchar(255),
	`metaAdSetId` varchar(255),
	`metaAdId` varchar(255),
	`correctedLeadCount` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_corrections_id` PRIMARY KEY(`id`)
);
