"use client";

import { useActionState, useState, useRef } from "react";
import { updateProfile, uploadProfilePicture, removeProfilePicture, type ProfileState } from "@/actions/profiles";

export function ProfileEditForm({
  currentFullName,
  currentAvatarUrl,
}: {
  currentFullName: string | null;
  currentAvatarUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(updateProfile, null);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setAvatarError(null);

    const fd = new FormData();
    fd.append("avatar", file);
    const result = await uploadProfilePicture(fd);

    if ("error" in result) {
      setAvatarError(result.error);
    } else {
      setAvatarUrl(result.url);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleRemoveAvatar() {
    setUploading(true);
    setAvatarError(null);
    const result = await removeProfilePicture();
    if (result?.error) {
      setAvatarError(result.error);
    } else {
      setAvatarUrl(null);
    }
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar upload */}
      <div>
        <label className="block text-sm font-medium text-text-muted mb-3">
          Profile Picture
        </label>
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
              {(currentFullName ?? "?")[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
            >
              {uploading ? "Uploading..." : avatarUrl ? "Change photo" : "Upload photo"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="text-sm text-text-dim hover:text-red-400 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>
        {avatarError && (
          <p className="text-xs text-red-400 mt-2">{avatarError}</p>
        )}
      </div>

      {/* Name form */}
      <form action={formAction} className="flex flex-col gap-4">
        {state && "error" in state && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
            {state.error}
          </div>
        )}
        {state && "success" in state && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-sm text-green-400">
            Profile updated!
          </div>
        )}

        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-text-muted mb-1">
            Full Name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            minLength={2}
            defaultValue={currentFullName ?? ""}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            placeholder="Your name"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
