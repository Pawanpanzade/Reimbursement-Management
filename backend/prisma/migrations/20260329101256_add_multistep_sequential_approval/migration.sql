-- AlterTable
ALTER TABLE "public"."approval_tasks" ADD COLUMN     "step" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."expenses" ADD COLUMN     "currentStep" INTEGER;

-- CreateTable
CREATE TABLE "public"."approval_configs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."approval_steps" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "approverId" TEXT NOT NULL,

    CONSTRAINT "approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "approval_configs_companyId_key" ON "public"."approval_configs"("companyId");

-- CreateIndex
CREATE INDEX "approval_configs_companyId_idx" ON "public"."approval_configs"("companyId");

-- CreateIndex
CREATE INDEX "approval_steps_configId_idx" ON "public"."approval_steps"("configId");

-- CreateIndex
CREATE INDEX "approval_steps_approverId_idx" ON "public"."approval_steps"("approverId");

-- CreateIndex
CREATE UNIQUE INDEX "approval_steps_configId_stepOrder_key" ON "public"."approval_steps"("configId", "stepOrder");

-- CreateIndex
CREATE INDEX "approval_tasks_expenseId_step_idx" ON "public"."approval_tasks"("expenseId", "step");

-- AddForeignKey
ALTER TABLE "public"."approval_configs" ADD CONSTRAINT "approval_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."approval_steps" ADD CONSTRAINT "approval_steps_configId_fkey" FOREIGN KEY ("configId") REFERENCES "public"."approval_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."approval_steps" ADD CONSTRAINT "approval_steps_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
