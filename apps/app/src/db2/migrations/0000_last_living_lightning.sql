CREATE TABLE `bounty` (
	`id` text PRIMARY KEY NOT NULL,
	`creator` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`status` text DEFAULT 'ongoing',
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bounty_id_unique` ON `bounty` (`id`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bountyId` text NOT NULL,
	`creator` text NOT NULL,
	`isComplete` integer DEFAULT false,
	`submissionDescription` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bountyId`) REFERENCES `bounty`(`id`) ON UPDATE no action ON DELETE no action
);
