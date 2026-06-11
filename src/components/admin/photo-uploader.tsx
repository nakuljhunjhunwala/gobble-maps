"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";

/** Public URL for a place-photos storage path (client-safe). */
export function publicPhotoUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/place-photos/${storagePath}`;
}

export interface PhotoUploaderProps {
  /** Place id (client-generated for new places) — used as the storage folder. */
  placeId: string;
  /** Current storage paths, in display order. */
  paths: string[];
  onChange: (paths: string[]) => void;
  max?: number;
}

export function PhotoUploader({
  placeId,
  paths,
  onChange,
  max = 6,
}: PhotoUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || uploading || paths.length >= max) return;

    setError("");
    setUploading(true);
    const supabase = createClient();
    const path = `${placeId}/${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("place-photos")
      .upload(path, file, { contentType: file.type || "image/jpeg" });
    setUploading(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    onChange([...paths, path]);
  };

  const remove = async (path: string) => {
    setError("");
    const supabase = createClient();
    const { error: removeError } = await supabase.storage
      .from("place-photos")
      .remove([path]);
    if (removeError) {
      setError(removeError.message);
      return;
    }
    onChange(paths.filter((p) => p !== path));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {paths.map((path) => (
          <div key={path} style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={publicPhotoUrl(path)}
              alt=""
              style={{
                width: 64,
                height: 64,
                borderRadius: 10,
                objectFit: "cover",
                display: "block",
              }}
            />
            <button
              type="button"
              className="ad-photo-x"
              aria-label="Remove photo"
              onClick={() => void remove(path)}
            >
              <Icon name="x" size={10} strokeWidth={3} color="#fff" />
            </button>
          </div>
        ))}
        {uploading && (
          <div className="ad-photo-add" style={{ cursor: "default" }}>
            Uploading…
          </div>
        )}
        {!uploading && paths.length < max && (
          <button
            type="button"
            className="ad-photo-add"
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="plus" size={18} color="var(--gb-mut)" strokeWidth={2.2} />{" "}
            Upload
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => void onFile(e)}
        />
      </div>
      {error && (
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#B4514B" }}>
          {error}
        </span>
      )}
    </div>
  );
}
