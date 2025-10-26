-- CreateTable
CREATE TABLE "DuplicateGroup" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "primaryLeadId" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolutionMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DuplicateGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicateGroupMember" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "duplicateGroupId" UUID NOT NULL,
    "leadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicateGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DuplicateGroup_tenantId_idx" ON "DuplicateGroup"("tenantId");

-- CreateIndex
CREATE INDEX "DuplicateGroup_resolved_idx" ON "DuplicateGroup"("resolved");

-- CreateIndex
CREATE INDEX "DuplicateGroup_createdAt_idx" ON "DuplicateGroup"("createdAt");

-- CreateIndex
CREATE INDEX "DuplicateGroupMember_duplicateGroupId_idx" ON "DuplicateGroupMember"("duplicateGroupId");

-- CreateIndex
CREATE INDEX "DuplicateGroupMember_leadId_idx" ON "DuplicateGroupMember"("leadId");

-- CreateIndex
CREATE INDEX "DuplicateGroupMember_createdAt_idx" ON "DuplicateGroupMember"("createdAt");

-- AddForeignKey
ALTER TABLE "DuplicateGroup" ADD CONSTRAINT "DuplicateGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateGroupMember" ADD CONSTRAINT "DuplicateGroupMember_duplicateGroupId_fkey" FOREIGN KEY ("duplicateGroupId") REFERENCES "DuplicateGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateGroupMember" ADD CONSTRAINT "DuplicateGroupMember_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;