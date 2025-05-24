CREATE TABLE IF NOT EXISTS "sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"setId" varchar,
	"name" varchar NOT NULL,
	"purpose" varchar,
	"userId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"isDeleted" boolean DEFAULT false,
	CONSTRAINT "sets_setId_unique" UNIQUE("setId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "setsToFolders" (
	"setId" integer NOT NULL,
	"folderId" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "folders" ADD COLUMN "isDeleted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "isDeleted" boolean DEFAULT false;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sets" ADD CONSTRAINT "sets_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "setsToFolders" ADD CONSTRAINT "setsToFolders_setId_sets_id_fk" FOREIGN KEY ("setId") REFERENCES "public"."sets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "setsToFolders" ADD CONSTRAINT "setsToFolders_folderId_folders_id_fk" FOREIGN KEY ("folderId") REFERENCES "public"."folders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
