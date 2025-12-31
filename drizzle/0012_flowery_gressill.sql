CREATE TABLE `ad_copies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`landingPageUrl` text NOT NULL,
	`shortText` text NOT NULL,
	`longText` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ad_copies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ad_copies` ADD CONSTRAINT `ad_copies_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;