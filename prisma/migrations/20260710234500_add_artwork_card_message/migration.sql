-- Add the ARTWORK_CARD value to the MessageType enum.
ALTER TYPE "MessageType" ADD VALUE 'ARTWORK_CARD';

-- Self-contained snapshot payload for special message cards (e.g. the
-- first-message artwork inquiry card). Null for ordinary text/image messages.
ALTER TABLE "Message" ADD COLUMN "metadata" JSONB;
