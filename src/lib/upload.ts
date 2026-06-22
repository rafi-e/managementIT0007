import { createUploadthing, type FileRouter } from "uploadthing/next";
import { requireAuth } from "./auth-actions";
import { createAttachment } from "./db";
import { z } from "zod";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
    .middleware(async () => {
      const session = await requireAuth();
      if (!session?.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  documentUploader: f({
    "application/pdf": { maxFileSize: "16MB", maxFileCount: 5 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 5 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
      maxFileCount: 5,
    },
    "text/csv": { maxFileSize: "8MB", maxFileCount: 3 },
    "text/plain": { maxFileSize: "4MB", maxFileCount: 3 },
  })
    .middleware(async () => {
      const session = await requireAuth();
      if (!session?.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  attachmentUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 10 },
    "application/pdf": { maxFileSize: "16MB", maxFileCount: 5 },
  })
    .input(z.object({ taskId: z.string() }))
    .middleware(async ({ input }) => {
      const session = await requireAuth();
      if (!session?.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id, taskId: input.taskId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const attachment = await createAttachment({
        taskId: metadata.taskId,
        name: file.name,
        url: file.ufsUrl,
        publicId: file.key,
        size: file.size,
        type: file.type,
        width: 0,
        height: 0,
      });
      return { uploadedBy: metadata.userId, url: file.ufsUrl, id: attachment.id };
    }),

  avatarUploader: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await requireAuth();
      if (!session?.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
