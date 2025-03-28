PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_bounty` (
	`id` text PRIMARY KEY NOT NULL,
	`creator` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`status` text DEFAULT 'ongoing' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_bounty`("id", "creator", "title", "description", "amount", "status", "created_at", "updated_at") SELECT "id", "creator", "title", "description", "amount", "status", "created_at", "updated_at" FROM `bounty`;--> statement-breakpoint
DROP TABLE `bounty`;--> statement-breakpoint
ALTER TABLE `__new_bounty` RENAME TO `bounty`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `bounty_id_unique` ON `bounty` (`id`);--> statement-breakpoint
CREATE TABLE `__new_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bountyId` text NOT NULL,
	`creator` text NOT NULL,
	`isComplete` integer DEFAULT false NOT NULL,
	`submissionDescription` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bountyId`) REFERENCES `bounty`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_submissions`("id", "bountyId", "creator", "isComplete", "submissionDescription", "created_at", "updated_at") SELECT "id", "bountyId", "creator", "isComplete", "submissionDescription", "created_at", "updated_at" FROM `submissions`;--> statement-breakpoint
DROP TABLE `submissions`;--> statement-breakpoint
ALTER TABLE `__new_submissions` RENAME TO `submissions`;--> statement-breakpoint
CREATE UNIQUE INDEX `submissions_bountyId_creator_unique` ON `submissions` (`bountyId`,`creator`);