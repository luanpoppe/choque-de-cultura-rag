-- AlterTable
ALTER TABLE "episodes" ADD COLUMN "last_ingest_error" TEXT;

-- CreateTable
CREATE TABLE "chunks" (
    "id" UUID NOT NULL,
    "episode_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "start_sec" INTEGER NOT NULL,
    "end_sec" INTEGER NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chunks_episode_id_idx" ON "chunks"("episode_id");

-- AddForeignKey
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
