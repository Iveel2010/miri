-- AlterTable
ALTER TABLE "Artwork" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Artwork_isFeatured_idx" ON "Artwork"("isFeatured");
