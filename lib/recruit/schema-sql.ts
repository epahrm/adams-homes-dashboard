// Additive, idempotent DDL for the Rec* tables. Executed by /api/recruit/setup
// because this project deploys without a migration step. Every statement is
// safe to re-run and never touches the existing Adams Homes tables.

const T = (sql: string) => sql.trim()

export const RECRUIT_DDL: string[] = [
  T(`CREATE TABLE IF NOT EXISTS "RecUser" (
    "id" TEXT NOT NULL, "email" TEXT NOT NULL, "password" TEXT NOT NULL,
    "name" TEXT NOT NULL, "role" TEXT NOT NULL, "athleteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecUser_pkey" PRIMARY KEY ("id"))`),
  T(`CREATE TABLE IF NOT EXISTS "RecProfile" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "slug" TEXT NOT NULL,
    "gradYear" INTEGER NOT NULL,
    "position" TEXT NOT NULL DEFAULT '', "clubTeam" TEXT NOT NULL DEFAULT '',
    "highSchool" TEXT NOT NULL DEFAULT '', "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '', "gpa" TEXT NOT NULL DEFAULT '',
    "height" TEXT NOT NULL DEFAULT '', "jerseyNumber" TEXT NOT NULL DEFAULT '',
    "ncaaRegistered" BOOLEAN NOT NULL DEFAULT false,
    "highlightUrl" TEXT NOT NULL DEFAULT '', "summary" TEXT NOT NULL DEFAULT '',
    "strengths" TEXT NOT NULL DEFAULT '[]', "academics" TEXT NOT NULL DEFAULT '',
    "honors" TEXT NOT NULL DEFAULT '', "refs" TEXT NOT NULL DEFAULT '',
    "upcoming" TEXT NOT NULL DEFAULT '', "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecProfile_pkey" PRIMARY KEY ("id"))`),
  T(`CREATE TABLE IF NOT EXISTS "RecTask" (
    "id" TEXT NOT NULL, "band" TEXT NOT NULL, "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL, "detail" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'STANDARD', "athleteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecTask_pkey" PRIMARY KEY ("id"))`),
  T(`CREATE TABLE IF NOT EXISTS "RecTaskProgress" (
    "id" TEXT NOT NULL, "athleteId" TEXT NOT NULL, "taskId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false, "completedAt" TIMESTAMP(3),
    CONSTRAINT "RecTaskProgress_pkey" PRIMARY KEY ("id"))`),
  T(`CREATE TABLE IF NOT EXISTS "RecModule" (
    "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL, "description" TEXT NOT NULL DEFAULT '',
    "band" TEXT NOT NULL DEFAULT 'ALL',
    CONSTRAINT "RecModule_pkey" PRIMARY KEY ("id"))`),
  T(`CREATE TABLE IF NOT EXISTS "RecLesson" (
    "id" TEXT NOT NULL, "moduleId" TEXT NOT NULL, "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL, "kind" TEXT NOT NULL DEFAULT 'READ',
    "content" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "RecLesson_pkey" PRIMARY KEY ("id"))`),
  T(`CREATE TABLE IF NOT EXISTS "RecLessonProgress" (
    "id" TEXT NOT NULL, "athleteId" TEXT NOT NULL, "lessonId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false, "completedAt" TIMESTAMP(3),
    CONSTRAINT "RecLessonProgress_pkey" PRIMARY KEY ("id"))`),
  T(`CREATE TABLE IF NOT EXISTS "RecSchool" (
    "id" TEXT NOT NULL, "athleteId" TEXT NOT NULL, "name" TEXT NOT NULL,
    "division" TEXT NOT NULL DEFAULT '', "conference" TEXT NOT NULL DEFAULT '',
    "coachName" TEXT NOT NULL DEFAULT '', "coachEmail" TEXT NOT NULL DEFAULT '',
    "coachTwitter" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'TARGET',
    "stage" TEXT NOT NULL DEFAULT 'RESEARCHING', "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecSchool_pkey" PRIMARY KEY ("id"))`),
  T(`CREATE TABLE IF NOT EXISTS "RecContact" (
    "id" TEXT NOT NULL, "schoolId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL DEFAULT 'NOTE', "summary" TEXT NOT NULL,
    CONSTRAINT "RecContact_pkey" PRIMARY KEY ("id"))`),
  T(`CREATE TABLE IF NOT EXISTS "RecQuestionnaire" (
    "id" TEXT NOT NULL, "athleteId" TEXT NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '{}', "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecQuestionnaire_pkey" PRIMARY KEY ("id"))`),
  T(`CREATE TABLE IF NOT EXISTS "RecResume" (
    "id" TEXT NOT NULL, "athleteId" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '{}', "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "advisorComment" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecResume_pkey" PRIMARY KEY ("id"))`),
  T(`CREATE TABLE IF NOT EXISTS "RecNote" (
    "id" TEXT NOT NULL, "athleteId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL DEFAULT 'ADVISOR', "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecNote_pkey" PRIMARY KEY ("id"))`),
  // Unique indexes
  T(`CREATE UNIQUE INDEX IF NOT EXISTS "RecUser_email_key" ON "RecUser"("email")`),
  T(`CREATE UNIQUE INDEX IF NOT EXISTS "RecProfile_userId_key" ON "RecProfile"("userId")`),
  T(`CREATE UNIQUE INDEX IF NOT EXISTS "RecProfile_slug_key" ON "RecProfile"("slug")`),
  T(`CREATE UNIQUE INDEX IF NOT EXISTS "RecTaskProgress_athleteId_taskId_key" ON "RecTaskProgress"("athleteId","taskId")`),
  T(`CREATE UNIQUE INDEX IF NOT EXISTS "RecModule_slug_key" ON "RecModule"("slug")`),
  T(`CREATE UNIQUE INDEX IF NOT EXISTS "RecLessonProgress_athleteId_lessonId_key" ON "RecLessonProgress"("athleteId","lessonId")`),
  T(`CREATE UNIQUE INDEX IF NOT EXISTS "RecQuestionnaire_athleteId_key" ON "RecQuestionnaire"("athleteId")`),
  T(`CREATE UNIQUE INDEX IF NOT EXISTS "RecResume_athleteId_key" ON "RecResume"("athleteId")`),
]

// Foreign keys, wrapped so re-runs are no-ops.
const FK = (name: string, sql: string) =>
  T(`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN ${sql}; END IF;
  END $$`)

export const RECRUIT_FKS: string[] = [
  FK('RecProfile_userId_fkey', `ALTER TABLE "RecProfile" ADD CONSTRAINT "RecProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "RecUser"("id") ON DELETE CASCADE`),
  FK('RecTask_athleteId_fkey', `ALTER TABLE "RecTask" ADD CONSTRAINT "RecTask_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "RecProfile"("id") ON DELETE CASCADE`),
  FK('RecTaskProgress_athleteId_fkey', `ALTER TABLE "RecTaskProgress" ADD CONSTRAINT "RecTaskProgress_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "RecProfile"("id") ON DELETE CASCADE`),
  FK('RecTaskProgress_taskId_fkey', `ALTER TABLE "RecTaskProgress" ADD CONSTRAINT "RecTaskProgress_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "RecTask"("id") ON DELETE CASCADE`),
  FK('RecLesson_moduleId_fkey', `ALTER TABLE "RecLesson" ADD CONSTRAINT "RecLesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "RecModule"("id") ON DELETE CASCADE`),
  FK('RecLessonProgress_athleteId_fkey', `ALTER TABLE "RecLessonProgress" ADD CONSTRAINT "RecLessonProgress_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "RecProfile"("id") ON DELETE CASCADE`),
  FK('RecLessonProgress_lessonId_fkey', `ALTER TABLE "RecLessonProgress" ADD CONSTRAINT "RecLessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "RecLesson"("id") ON DELETE CASCADE`),
  FK('RecSchool_athleteId_fkey', `ALTER TABLE "RecSchool" ADD CONSTRAINT "RecSchool_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "RecProfile"("id") ON DELETE CASCADE`),
  FK('RecContact_schoolId_fkey', `ALTER TABLE "RecContact" ADD CONSTRAINT "RecContact_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "RecSchool"("id") ON DELETE CASCADE`),
  FK('RecQuestionnaire_athleteId_fkey', `ALTER TABLE "RecQuestionnaire" ADD CONSTRAINT "RecQuestionnaire_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "RecProfile"("id") ON DELETE CASCADE`),
  FK('RecResume_athleteId_fkey', `ALTER TABLE "RecResume" ADD CONSTRAINT "RecResume_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "RecProfile"("id") ON DELETE CASCADE`),
  FK('RecNote_athleteId_fkey', `ALTER TABLE "RecNote" ADD CONSTRAINT "RecNote_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "RecProfile"("id") ON DELETE CASCADE`),
]
