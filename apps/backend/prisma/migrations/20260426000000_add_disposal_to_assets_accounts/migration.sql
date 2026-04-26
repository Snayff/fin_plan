-- Add disposal columns to Asset
ALTER TABLE "Asset" ADD COLUMN "disposedAt" DATE;
ALTER TABLE "Asset" ADD COLUMN "disposalAccountId" TEXT;

ALTER TABLE "Asset" ADD CONSTRAINT "Asset_disposalAccountId_fkey"
  FOREIGN KEY ("disposalAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Asset_disposalAccountId_idx" ON "Asset"("disposalAccountId");

-- Add disposal columns to Account
ALTER TABLE "Account" ADD COLUMN "disposedAt" DATE;
ALTER TABLE "Account" ADD COLUMN "disposalAccountId" TEXT;

ALTER TABLE "Account" ADD CONSTRAINT "Account_disposalAccountId_fkey"
  FOREIGN KEY ("disposalAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Account_disposalAccountId_idx" ON "Account"("disposalAccountId");
