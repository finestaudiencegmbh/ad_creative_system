CREATE TABLE `creative_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`campaignId` varchar(255) NOT NULL,
	`landingPageUrl` text NOT NULL,
	`format` enum('feed','story','reel') NOT NULL,
	`count` int NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`result` json,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `creative_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `creative_jobs_jobId_unique` UNIQUE(`jobId`)
);
--> statement-breakpoint
ALTER TABLE `creative_jobs` ADD CONSTRAINT `creative_jobs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;