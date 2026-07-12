-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'MISSING', 'DAMAGED');

-- CreateEnum
CREATE TYPE "DiscrepancySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "audit_cycles" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "department_id" UUID NOT NULL,
    "location" VARCHAR(255),
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_assignments" (
    "id" UUID NOT NULL,
    "audit_cycle_id" UUID NOT NULL,
    "auditor_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_items" (
    "id" UUID NOT NULL,
    "audit_cycle_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "verified_by" UUID,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discrepancy_reports" (
    "id" UUID NOT NULL,
    "audit_item_id" UUID NOT NULL,
    "severity" "DiscrepancySeverity" NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discrepancy_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_cycles_department_id_idx" ON "audit_cycles"("department_id");

-- CreateIndex
CREATE INDEX "audit_cycles_status_idx" ON "audit_cycles"("status");

-- CreateIndex
CREATE INDEX "audit_assignments_audit_cycle_id_idx" ON "audit_assignments"("audit_cycle_id");

-- CreateIndex
CREATE INDEX "audit_assignments_auditor_id_idx" ON "audit_assignments"("auditor_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_assignments_audit_cycle_id_auditor_id_key" ON "audit_assignments"("audit_cycle_id", "auditor_id");

-- CreateIndex
CREATE INDEX "audit_items_audit_cycle_id_idx" ON "audit_items"("audit_cycle_id");

-- CreateIndex
CREATE INDEX "audit_items_asset_id_idx" ON "audit_items"("asset_id");

-- CreateIndex
CREATE INDEX "audit_items_verification_status_idx" ON "audit_items"("verification_status");

-- CreateIndex
CREATE UNIQUE INDEX "audit_items_audit_cycle_id_asset_id_key" ON "audit_items"("audit_cycle_id", "asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "discrepancy_reports_audit_item_id_key" ON "discrepancy_reports"("audit_item_id");

-- CreateIndex
CREATE INDEX "discrepancy_reports_resolved_idx" ON "discrepancy_reports"("resolved");

-- AddForeignKey
ALTER TABLE "audit_cycles" ADD CONSTRAINT "audit_cycles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_cycles" ADD CONSTRAINT "audit_cycles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_assignments" ADD CONSTRAINT "audit_assignments_audit_cycle_id_fkey" FOREIGN KEY ("audit_cycle_id") REFERENCES "audit_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_assignments" ADD CONSTRAINT "audit_assignments_auditor_id_fkey" FOREIGN KEY ("auditor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_audit_cycle_id_fkey" FOREIGN KEY ("audit_cycle_id") REFERENCES "audit_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discrepancy_reports" ADD CONSTRAINT "discrepancy_reports_audit_item_id_fkey" FOREIGN KEY ("audit_item_id") REFERENCES "audit_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discrepancy_reports" ADD CONSTRAINT "discrepancy_reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
