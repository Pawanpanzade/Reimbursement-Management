-- AlterTable
ALTER TABLE "public"."expenses" ALTER COLUMN "status" SET DEFAULT 'pending_approval';

-- CreateTable
CREATE TABLE "public"."approval_tasks" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "comment" TEXT,
    "actedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "approval_tasks_expenseId_idx" ON "public"."approval_tasks"("expenseId");

-- CreateIndex
CREATE INDEX "approval_tasks_approverId_idx" ON "public"."approval_tasks"("approverId");

-- CreateIndex
CREATE INDEX "approval_tasks_approverId_status_idx" ON "public"."approval_tasks"("approverId", "status");

-- AddForeignKey
ALTER TABLE "public"."approval_tasks" ADD CONSTRAINT "approval_tasks_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "public"."expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."approval_tasks" ADD CONSTRAINT "approval_tasks_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
