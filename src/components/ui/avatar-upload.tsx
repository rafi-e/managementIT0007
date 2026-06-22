"use client";

import * as React from "react";
import { useRef, useState, useCallback } from "react";
import { Button } from "./button";
import { Upload, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { saveAvatarUrl } from "@/actions/avatar";
import toast from "react-hot-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface AvatarUploadProps {
  userId: string;
  onUploadComplete: (url: string) => void;
}

export function AvatarUpload({ userId, onUploadComplete }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }

      setUploading(true);
      try {
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `avatars/${userId}/${timestamp}_${sanitizedName}`;

        const { data, error } = await supabase.storage
          .from("task-attachments")
          .upload(filePath, file, {
            contentType: file.type,
            cacheControl: "3600",
            upsert: true,
          });

        if (error) throw new Error(error.message);

        const {
          data: { publicUrl },
        } = supabase.storage.from("task-attachments").getPublicUrl(data.path);

        await saveAvatarUrl(publicUrl);
        onUploadComplete(publicUrl);
        toast.success("Avatar updated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [userId, onUploadComplete]
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={uploading}
        className="gap-2"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {uploading ? "Uploading..." : "Change photo"}
      </Button>
    </>
  );
}
