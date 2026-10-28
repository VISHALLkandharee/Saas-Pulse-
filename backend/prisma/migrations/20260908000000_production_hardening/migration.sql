-- Keep existing API keys operational while moving all new keys to one-way hashes.
ALTER TABLE "ApiKey" ALTER COLUMN "key" DROP NOT NULL;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "keyHash" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "prefix" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "last4" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- Events need a source identity and source timestamp for retry safety and accurate analytics.
ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Activity" SET "occurredAt" = "createdAt";
CREATE UNIQUE INDEX IF NOT EXISTS "Activity_userId_externalId_key" ON "Activity"("userId", "externalId");
CREATE INDEX IF NOT EXISTS "Activity_userId_occurredAt_idx" ON "Activity"("userId", "occurredAt");
