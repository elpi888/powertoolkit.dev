-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "parentChatId" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "modelId" TEXT NOT NULL DEFAULT 'openai:gpt-4o';

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_parentChatId_fkey" FOREIGN KEY ("parentChatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
