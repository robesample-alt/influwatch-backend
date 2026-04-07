ALTER TABLE "ambassador_profiles" ADD COLUMN "supervisoryRelationship" TEXT;
UPDATE "ambassador_profiles" SET "supervisoryRelationship" = 'SUPERVISED' WHERE "supervisoryRelationship" IS NULL;
