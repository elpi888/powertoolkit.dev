import { z } from "zod";

import { NextResponse } from "next/server";

import { put } from "@vercel/blob";

import { auth } from "@clerk/nextjs/server"; // Changed to Clerk's auth
import { api } from "@/trpc/server";
import { FILE_MAX_SIZE } from "@/lib/constants";

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= FILE_MAX_SIZE, {
      message: "File size should be less than 5MB",
    })
    // Update the file type based on the kind of files you want to accept
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "application/pdf"].includes(file.type),
      {
        message: "File type should be JPEG or PNG",
      },
    ),
});

export async function POST(request: Request) {
  const authData = await auth(); // Use Clerk's auth

  if (!authData.userId) { // Check Clerk's userId
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get("file") as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      const data = await put(
        `${authData.userId}/${crypto.randomUUID()}`, // Use Clerk's userId
        fileBuffer,
        {
          access: "public",
        },
      );

      const file = await api.files.createFile({
        name: filename,
        url: data.url,
        contentType: validatedFile.data.file.type,
      });

      return NextResponse.json(file);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
