CREATE TABLE "ModerationLog" (
    "id" TEXT NOT NULL,
    "reportId" TEXT,
    "postId" TEXT,
    "moderatorId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ModerationLog_reportId_idx" ON "ModerationLog"("reportId");
CREATE INDEX "ModerationLog_postId_idx" ON "ModerationLog"("postId");
CREATE INDEX "ModerationLog_moderatorId_idx" ON "ModerationLog"("moderatorId");
CREATE INDEX "ModerationLog_action_idx" ON "ModerationLog"("action");
CREATE INDEX "ModerationLog_createdAt_idx" ON "ModerationLog"("createdAt");

ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_reportId_fkey"
  FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_moderatorId_fkey"
  FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ModerationLog" ENABLE ROW LEVEL SECURITY;
