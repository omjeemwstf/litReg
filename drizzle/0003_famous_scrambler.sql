CREATE TABLE IF NOT EXISTS "folders" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"parentId" varchar,
	"type" varchar NOT NULL,
	"userId" integer
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "folders" ADD CONSTRAINT "folders_parentId_folders_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."folders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "folders" ADD CONSTRAINT "folders_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
