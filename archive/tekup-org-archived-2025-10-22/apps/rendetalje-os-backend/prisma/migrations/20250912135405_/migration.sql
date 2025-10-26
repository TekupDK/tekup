-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'PENDING',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "emailVerified" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cleaning_teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseLocation" TEXT NOT NULL,
    "operatingHours" JSONB NOT NULL,
    "vehicleInfo" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cleaning_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cleaning_employees" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cprNumber" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "specializations" TEXT[],
    "weeklySchedule" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cleaning_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employment_contracts" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "monthlySalary" DOUBLE PRECISION NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "collectiveAgreement" TEXT NOT NULL,
    "workingHours" INTEGER NOT NULL DEFAULT 37,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "employment_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."working_time_records" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hoursWorked" DOUBLE PRECISION NOT NULL,
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "breakMinutes" INTEGER NOT NULL,
    "workType" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "working_time_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "municipality" TEXT NOT NULL,
    "customerType" TEXT NOT NULL,
    "contractType" TEXT NOT NULL,
    "preferences" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cleaning_jobs" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "jobType" TEXT NOT NULL,
    "estimatedDuration" INTEGER NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "requirements" TEXT[],
    "equipmentNeeded" TEXT[],
    "recurring" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cleaning_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scheduled_jobs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "assignedMemberId" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "progressNotes" TEXT,
    "qualityScore" INTEGER,
    "customerFeedback" TEXT,
    "complianceNotes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_progress_logs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" JSONB,
    "notes" TEXT,
    "images" TEXT[],

    CONSTRAINT "job_progress_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."optimized_routes" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "routes" JSONB NOT NULL,
    "optimization" JSONB NOT NULL,
    "compliance" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "optimized_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff_schedules" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "bookingId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "staff_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."equipment" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "lastInspection" TIMESTAMP(3),
    "nextInspectionDue" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."compliance_reports" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "period" JSONB NOT NULL,
    "overallStatus" TEXT NOT NULL,
    "memberCompliance" JSONB NOT NULL,
    "violations" JSONB NOT NULL,
    "recommendations" TEXT[],
    "danishLawRequirements" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."safety_training" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "trainingType" TEXT NOT NULL,
    "completedBy" TEXT[],
    "completionDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "certificationBody" TEXT,
    "notes" TEXT,

    CONSTRAINT "safety_training_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cleaning_employees_cprNumber_key" ON "public"."cleaning_employees"("cprNumber");

-- CreateIndex
CREATE UNIQUE INDEX "employment_contracts_employeeId_key" ON "public"."employment_contracts"("employeeId");

-- AddForeignKey
ALTER TABLE "public"."cleaning_employees" ADD CONSTRAINT "cleaning_employees_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."cleaning_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employment_contracts" ADD CONSTRAINT "employment_contracts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."cleaning_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."working_time_records" ADD CONSTRAINT "working_time_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."cleaning_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_jobs" ADD CONSTRAINT "cleaning_jobs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheduled_jobs" ADD CONSTRAINT "scheduled_jobs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."cleaning_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheduled_jobs" ADD CONSTRAINT "scheduled_jobs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheduled_jobs" ADD CONSTRAINT "scheduled_jobs_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."cleaning_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheduled_jobs" ADD CONSTRAINT "scheduled_jobs_assignedMemberId_fkey" FOREIGN KEY ("assignedMemberId") REFERENCES "public"."cleaning_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_progress_logs" ADD CONSTRAINT "job_progress_logs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."scheduled_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."optimized_routes" ADD CONSTRAINT "optimized_routes_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."cleaning_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment" ADD CONSTRAINT "equipment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."cleaning_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compliance_reports" ADD CONSTRAINT "compliance_reports_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."cleaning_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."safety_training" ADD CONSTRAINT "safety_training_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."cleaning_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
