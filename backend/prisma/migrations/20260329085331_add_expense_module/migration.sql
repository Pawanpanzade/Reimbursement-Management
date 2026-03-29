-- CreateTable
CREATE TABLE "public"."expenses" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "submittedAmount" DOUBLE PRECISION NOT NULL,
    "submittedCurrency" TEXT NOT NULL,
    "convertedAmount" DOUBLE PRECISION NOT NULL,
    "companyCurrency" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expenses_companyId_idx" ON "public"."expenses"("companyId");

-- CreateIndex
CREATE INDEX "expenses_employeeId_idx" ON "public"."expenses"("employeeId");

-- CreateIndex
CREATE INDEX "expenses_companyId_employeeId_idx" ON "public"."expenses"("companyId", "employeeId");

-- CreateIndex
CREATE INDEX "expenses_companyId_status_idx" ON "public"."expenses"("companyId", "status");

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenses" ADD CONSTRAINT "expenses_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
