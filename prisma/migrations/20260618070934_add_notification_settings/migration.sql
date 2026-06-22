-- CreateTable
CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignments" BOOLEAN NOT NULL DEFAULT true,
    "comments" BOOLEAN NOT NULL DEFAULT true,
    "mentions" BOOLEAN NOT NULL DEFAULT true,
    "dueDates" BOOLEAN NOT NULL DEFAULT true,
    "statusChanges" BOOLEAN NOT NULL DEFAULT true,
    "invitations" BOOLEAN NOT NULL DEFAULT true,
    "workspaceAnnouncements" BOOLEAN NOT NULL DEFAULT false,
    "emailDigest" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_userId_key" ON "NotificationSetting"("userId");

-- CreateIndex
CREATE INDEX "NotificationSetting_userId_idx" ON "NotificationSetting"("userId");

-- AddForeignKey
ALTER TABLE "NotificationSetting" ADD CONSTRAINT "NotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
