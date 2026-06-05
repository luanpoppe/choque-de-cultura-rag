-- CreateTable
CREATE TABLE "transcript_segments" (
    "id" UUID NOT NULL,
    "episode_id" UUID NOT NULL,
    "ord" INTEGER NOT NULL,
    "start_sec" DOUBLE PRECISION NOT NULL,
    "end_sec" DOUBLE PRECISION NOT NULL,
    "text" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'whisper',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcript_segments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transcript_segments_episode_id_idx" ON "transcript_segments"("episode_id");

-- AddForeignKey
ALTER TABLE "transcript_segments" ADD CONSTRAINT "transcript_segments_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
