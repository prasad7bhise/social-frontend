"use client";

import { useState, useRef } from "react";
import { uploadFile, createPost } from "@/lib/api/feedApi";
import { EmojiPickerButton } from "./EmojiPickerButton";
import { MediaType } from "@/lib/types/enums";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreatePostModal({ open, onClose, onCreated }: Props) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
    selected.forEach((f) => {
      const url = URL.createObjectURL(f);
      setPreviews((prev) => [...prev, url]);
    });
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    if (!content.trim() && files.length === 0) return;
    setUploading(true);
    try {
      const media = [];
      for (const file of files) {
        const { url } = await uploadFile(file);
        media.push({
          type: file.type.startsWith("video") ? MediaType.VIDEO : MediaType.IMAGE,
          url,
        });
      }
      await createPost({ content: content.trim(), media });
      setContent("");
      setFiles([]);
      setPreviews([]);
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-5 py-4">
          <button onClick={onClose} className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            Cancel
          </button>
          <h2 className="font-semibold text-zinc-900 dark:text-white">Create post</h2>
          <button
            onClick={handleSubmit}
            disabled={uploading || (!content.trim() && files.length === 0)}
            className="text-sm font-semibold text-sky-500 hover:text-sky-600 disabled:opacity-40"
          >
            {uploading ? "Uploading..." : "Share"}
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative">
            <textarea
              placeholder="Write a caption..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent p-3 pr-10 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
            />
            <div className="absolute bottom-2 right-2">
              <EmojiPickerButton
                onSelect={(emoji) => setContent((prev) => prev + emoji)}
              />
            </div>
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {files[i]?.type.startsWith("video") ? (
                    <video src={url} className="h-full w-full object-cover" />
                  ) : (
                    <img src={url} className="h-full w-full object-cover" />
                  )}
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            Add photos / videos
          </button>
        </div>
      </div>
    </div>
  );
}
