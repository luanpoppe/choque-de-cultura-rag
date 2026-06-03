-- CreateEnum
CREATE TYPE "IngestionJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ingestion_jobs" (
    "id" UUID NOT NULL,
    "status" "IngestionJobStatus" NOT NULL DEFAULT 'PENDING',
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ingestion_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" UUID NOT NULL,
    "youtube_video_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "watch_url" TEXT NOT NULL,
    "duration_sec" INTEGER,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ingestion_job_id" UUID,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "episodes_youtube_video_id_key" ON "episodes"("youtube_video_id");

-- CreateIndex
CREATE INDEX "episodes_ingestion_job_id_idx" ON "episodes"("ingestion_job_id");

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_ingestion_job_id_fkey" FOREIGN KEY ("ingestion_job_id") REFERENCES "ingestion_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
