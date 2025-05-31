CREATE TABLE IF NOT EXISTS "folders" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"parentId" varchar,
	"type" varchar NOT NULL,
	"link" varchar,
	"isProcessed" boolean DEFAULT true,
	"meta" jsonb,
	"createdAt" timestamp DEFAULT now(),
	"userId" integer,
	"isDeleted" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "instructionSheet" (
	"id" serial PRIMARY KEY NOT NULL,
	"sheetId" varchar,
	"link" varchar,
	"meta" jsonb,
	"userId" integer NOT NULL,
	"setId" integer NOT NULL,
	"isDeleted" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "instructionSheet_sheetId_unique" UNIQUE("sheetId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "query" (
	"id" serial PRIMARY KEY NOT NULL,
	"setId" integer NOT NULL,
	"queryId" varchar,
	"isDeleted" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "query_queryId_unique" UNIQUE("queryId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"setId" varchar NOT NULL,
	"name" varchar NOT NULL,
	"purpose" varchar NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"isDeleted" boolean DEFAULT false,
	CONSTRAINT "sets_setId_unique" UNIQUE("setId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "setsToFolders" (
	"setId" integer NOT NULL,
	"fileId" varchar NOT NULL,
	"isDeleted" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "setsToFolders_setId_fileId_pk" PRIMARY KEY("setId","fileId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar,
	"email" varchar,
	"password" varchar,
	"userName" varchar,
	"phone" varchar,
	"tokens" varchar,
	"signMethod" varchar,
	"isVerified" boolean,
	"documents" jsonb,
	"isDeleted" boolean DEFAULT false,
	CONSTRAINT "users_userId_unique" UNIQUE("userId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
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
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "instructionSheet" ADD CONSTRAINT "instructionSheet_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "instructionSheet" ADD CONSTRAINT "instructionSheet_setId_sets_id_fk" FOREIGN KEY ("setId") REFERENCES "public"."sets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query" ADD CONSTRAINT "query_setId_sets_id_fk" FOREIGN KEY ("setId") REFERENCES "public"."sets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
 ALTER TABLE "setsToFolders" ADD CONSTRAINT "setsToFolders_fileId_folders_id_fk" FOREIGN KEY ("fileId") REFERENCES "public"."folders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
