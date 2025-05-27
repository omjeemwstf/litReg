ALTER TABLE "query" ADD COLUMN "version" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sets" ADD COLUMN "version" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "setsToFolders" ADD COLUMN "version" integer DEFAULT 0;