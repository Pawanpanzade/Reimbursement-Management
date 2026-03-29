-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "users_managerId_idx" ON "public"."users"("managerId");

-- CreateIndex
CREATE INDEX "users_companyId_role_idx" ON "public"."users"("companyId", "role");
