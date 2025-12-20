CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metaCampaignId` varchar(255),
	`metaAdSetId` varchar(255),
	`metaAdId` varchar(255),
	`orderValue` decimal(10,2) NOT NULL,
	`cashCollect` decimal(10,2) NOT NULL,
	`completionDate` timestamp NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
