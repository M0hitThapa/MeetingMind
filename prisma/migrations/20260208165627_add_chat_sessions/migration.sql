/*
  Migration to add chat sessions support
  Strategy: 
  1. Create chat_sessions table
  2. Add nullable chatSessionId column to queries
  3. Create default chat sessions for existing queries
  4. Link queries to sessions
  5. Make chatSessionId required
  6. Add foreign key constraint
*/

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_sessions_meetingId_idx" ON "chat_sessions"("meetingId");

-- CreateIndex
CREATE INDEX "chat_sessions_userId_idx" ON "chat_sessions"("userId");

-- CreateIndex
CREATE INDEX "chat_sessions_updatedAt_idx" ON "chat_sessions"("updatedAt");

-- AddForeignKey for chat_sessions
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 1: Add nullable column
ALTER TABLE "queries" ADD COLUMN "chatSessionId" TEXT;

-- Step 2: Create default chat sessions for each meeting/user combination
-- We'll create one session per meeting/user that has queries
DO $$
DECLARE
    query_rec RECORD;
    session_id TEXT;
BEGIN
    FOR query_rec IN 
        SELECT DISTINCT "meetingId", "userId", MIN("createdAt") as first_query_time
        FROM "queries"
        GROUP BY "meetingId", "userId"
    LOOP
        -- Generate a new session ID
        session_id := gen_random_uuid()::text;
        
        -- Create the chat session
        INSERT INTO "chat_sessions" ("id", "meetingId", "userId", "title", "createdAt", "updatedAt")
        VALUES (session_id, query_rec."meetingId", query_rec."userId", 'Previous Chat', query_rec.first_query_time, NOW());
        
        -- Update all matching queries to use this session
        UPDATE "queries"
        SET "chatSessionId" = session_id
        WHERE "meetingId" = query_rec."meetingId" 
        AND ("userId" = query_rec."userId" OR ("userId" IS NULL AND query_rec."userId" IS NULL));
    END LOOP;
END $$;

-- Step 3: For any queries that still don't have a session (fallback), create a general session
DO $$
DECLARE
    query_rec RECORD;
    session_id TEXT;
BEGIN
    FOR query_rec IN 
        SELECT DISTINCT "meetingId", "userId"
        FROM "queries"
        WHERE "chatSessionId" IS NULL
    LOOP
        session_id := gen_random_uuid()::text;
        
        INSERT INTO "chat_sessions" ("id", "meetingId", "userId", "title", "createdAt", "updatedAt")
        VALUES (session_id, query_rec."meetingId", query_rec."userId", 'Previous Chat', NOW(), NOW());
        
        UPDATE "queries"
        SET "chatSessionId" = session_id
        WHERE "meetingId" = query_rec."meetingId" 
        AND ("userId" = query_rec."userId" OR ("userId" IS NULL AND query_rec."userId" IS NULL))
        AND "chatSessionId" IS NULL;
    END LOOP;
END $$;

-- Step 4: Make column required
ALTER TABLE "queries" ALTER COLUMN "chatSessionId" SET NOT NULL;

-- Step 5: Create index
CREATE INDEX "queries_chatSessionId_idx" ON "queries"("chatSessionId");

-- Step 6: Add foreign key constraint
ALTER TABLE "queries" ADD CONSTRAINT "queries_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
