ALTER TABLE "setsToFolders" RENAME COLUMN "folderId" TO "fileId";--> statement-breakpoint
ALTER TABLE "setsToFolders" DROP CONSTRAINT "setsToFolders_folderId_folders_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "setsToFolders" ADD CONSTRAINT "setsToFolders_fileId_folders_id_fk" FOREIGN KEY ("fileId") REFERENCES "public"."folders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
