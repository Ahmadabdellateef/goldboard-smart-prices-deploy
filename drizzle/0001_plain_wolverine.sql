CREATE TABLE `gold_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(120) NOT NULL,
	`karat` varchar(32) NOT NULL,
	`price` decimal(12,2) NOT NULL,
	`change` decimal(8,2) NOT NULL DEFAULT '0',
	`sortOrder` int NOT NULL DEFAULT 0,
	`isVisible` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gold_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `store_settings` (
	`id` int NOT NULL DEFAULT 1,
	`storeName` varchar(160) NOT NULL,
	`city` varchar(120) NOT NULL,
	`displayTitle` varchar(180) NOT NULL,
	`currency` varchar(32) NOT NULL,
	`unit` varchar(32) NOT NULL,
	`note` text NOT NULL,
	`logoUrl` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `store_settings_id` PRIMARY KEY(`id`)
);
