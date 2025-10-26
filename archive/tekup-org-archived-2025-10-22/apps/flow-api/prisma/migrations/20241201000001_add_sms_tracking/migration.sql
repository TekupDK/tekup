-- CreateTable
CREATE TABLE "SMSTracking" (
    "id" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "trackingUrl" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "clickedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMSTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SMSTracking_trackingId_key" ON "SMSTracking"("trackingId");

-- CreateIndex
CREATE INDEX "SMSTracking_leadId_idx" ON "SMSTracking"("leadId");

-- CreateIndex
CREATE INDEX "SMSTracking_tenantId_idx" ON "SMSTracking"("tenantId");

-- CreateIndex
CREATE INDEX "SMSTracking_trackingId_idx" ON "SMSTracking"("trackingId");

-- CreateIndex
CREATE INDEX "SMSTracking_sentAt_idx" ON "SMSTracking"("sentAt");

-- AddForeignKey
ALTER TABLE "SMSTracking" ADD CONSTRAINT "SMSTracking_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMSTracking" ADD CONSTRAINT "SMSTracking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;