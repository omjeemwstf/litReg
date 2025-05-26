CREATE TABLE IF NOT EXISTS "query" (
	"id" serial PRIMARY KEY NOT NULL,
	"setId" integer NOT NULL,
	"queryId" varchar,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "query_queryId_unique" UNIQUE("queryId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query" ADD CONSTRAINT "query_setId_sets_id_fk" FOREIGN KEY ("setId") REFERENCES "public"."sets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
