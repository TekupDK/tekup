CREATE TABLE `attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emailId` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`mimeType` varchar(128),
	`size` int,
	`storageKey` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_label_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`priority` int NOT NULL DEFAULT 0,
	`conditions` json,
	`actions` json,
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_label_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_pipeline_state` (
	`threadId` varchar(255) NOT NULL,
	`stage` enum('needs_action','venter_pa_svar','i_kalender','finance','afsluttet') NOT NULL,
	`source` varchar(64),
	`taskType` varchar(64),
	`leadId` int,
	`calendarEventId` varchar(255),
	`invoiceId` varchar(255),
	`transitionedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_pipeline_state_threadId` PRIMARY KEY(`threadId`)
);
--> statement-breakpoint
CREATE TABLE `email_pipeline_transitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` varchar(255) NOT NULL,
	`fromStage` varchar(64),
	`toStage` varchar(64) NOT NULL,
	`triggeredBy` varchar(255),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_pipeline_transitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`providerId` varchar(255) NOT NULL,
	`fromEmail` varchar(320) NOT NULL,
	`toEmail` varchar(320) NOT NULL,
	`subject` text,
	`text` text,
	`html` text,
	`receivedAt` timestamp NOT NULL,
	`threadKey` varchar(255),
	`customerId` int,
	`emailThreadId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emails_id` PRIMARY KEY(`id`),
	CONSTRAINT `emails_providerId_unique` UNIQUE(`providerId`)
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `orderIndex` int;