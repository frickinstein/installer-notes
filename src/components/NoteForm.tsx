"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { submitNote, type NoteFormState } from "@/actions/notes";
import { DifficultyPicker } from "./DifficultyPicker";
import { trackEvent } from "@/lib/analytics";

const MAX_PHOTOS = 5;

type ExistingMedia = { id: string; storage_path: string };

type ExistingNote = {
  id: string;
  note_type?: string;
  trim_package?: string | null;
  general_tips: string;
  tools_needed: string | null;
  common_problems: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  installer_note_difficulty: Array<{
    rollups: number | null;
    back_glass: number | null;
    windshield: number | null;
    sunroof: number | null;
    quarter_glass: number | null;
  }> | null;
  installer_note_ppf_difficulty: Array<{
    hood: number | null;
    front_bumper: number | null;
    fender: number | null;
    roof: number | null;
    doors: number | null;
    quarter_panels: number | null;
    trunk_lid: number | null;
    rear_bumper: number | null;
  }> | null;
  installer_note_media: ExistingMedia[] | null;
} | null;

export function NoteForm({
  groupId,
  vehicleName,
  existingTintNote,
  existingPpfNote,
  defaultType = "tint",
  supabaseUrl,
}: {
  groupId: string;
  vehicleName: string;
  existingTintNote?: ExistingNote;
  existingPpfNote?: ExistingNote;
  defaultType?: "tint" | "ppf";
  supabaseUrl: string;
}) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [noteType, setNoteType] = useState<"tint" | "ppf">(defaultType);

  const activeExisting = noteType === "tint" ? existingTintNote : existingPpfNote;

  // Photo state — resets when type changes
  const [keptPhotos, setKeptPhotos] = useState<ExistingMedia[]>(
    activeExisting?.installer_note_media ?? []
  );
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const totalPhotos = keptPhotos.length + newPhotos.length;

  function switchType(type: "tint" | "ppf") {
    if (type === noteType) return;
    const target = type === "tint" ? existingTintNote : existingPpfNote;
    // Clean up current preview URLs
    previews.forEach((url) => URL.revokeObjectURL(url));
    setKeptPhotos(target?.installer_note_media ?? []);
    setNewPhotos([]);
    setPreviews([]);
    setNoteType(type);
  }

  function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const slots = MAX_PHOTOS - totalPhotos;
    const toAdd = files.slice(0, slots);
    setNewPhotos((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeKept(id: string) {
    setKeptPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function removeNew(index: number) {
    URL.revokeObjectURL(previews[index]);
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function wrappedAction(_prev: NoteFormState, formData: FormData): Promise<NoteFormState> {
    newPhotos.forEach((file, i) => formData.set(`photo_${i}`, file));
    formData.set("keep_photo_ids", keptPhotos.map((p) => p.id).join(","));
    return submitNote(_prev, formData);
  }

  const [state, formAction, pending] = useActionState<NoteFormState, FormData>(wrappedAction, null);

  useEffect(() => {
    if (state && "success" in state) {
      trackEvent("note_submitted", { vehicle: vehicleName, group_id: groupId, note_type: noteType });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((state as any).status === "approved") {
        router.push(`/vehicle/${groupId}`);
      } else {
        // Redirect but indicate the note is pending review so the vehicle page can show a notice
        router.push(`/vehicle/${groupId}?submitted_for_review=1`);
      }
    }
  }, [state, groupId, vehicleName, noteType, router]);

  function storageUrl(path: string) {
    return `${supabaseUrl}/storage/v1/object/public/installer-note-media/${path}`;
  }

  const tintDifficulty   = activeExisting?.installer_note_difficulty?.[0]     ?? undefined;
  const ppfDifficulty    = activeExisting?.installer_note_ppf_difficulty?.[0]  ?? undefined;
  const activeDifficulty = noteType === "ppf" ? ppfDifficulty : tintDifficulty;

  const isEditing = !!activeExisting;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="group_id"  value={groupId} />
      <input type="hidden" name="note_type" value={noteType} />

      {state && "error" in state && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {/* Note type toggle */}
      <div>
        <p className="text-xs font-semibold text-text-dim uppercase tracking-wide mb-2">
          Note Type
        </p>
        <div className="flex rounded-xl overflow-hidden border border-border">
          <button
            type="button"
            onClick={() => switchType("tint")}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              noteType === "tint"
                ? "bg-primary text-white"
                : "bg-bg text-text-muted hover:text-text-bright"
            }`}
          >
            Window Tint
            {existingTintNote && noteType !== "tint" && (
              <span className="ml-1.5 text-xs font-normal opacity-70">(existing note)</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => switchType("ppf")}
            className={`flex-1 py-3 text-sm font-bold transition-colors border-l border-border ${
              noteType === "ppf"
                ? "bg-primary text-white"
                : "bg-bg text-text-muted hover:text-text-bright"
            }`}
          >
            PPF
            {existingPpfNote && noteType !== "ppf" && (
              <span className="ml-1.5 text-xs font-normal opacity-70">(existing note)</span>
            )}
          </button>
        </div>
      </div>

      <p className="text-sm text-text-muted -mt-2">
        {isEditing ? "Editing your note for" : "Adding a note for"}{" "}
        <strong className="text-text-bright">{vehicleName}</strong>
      </p>

      {/* Trim package — PPF only; rendered with key so it resets when type switches */}
      {noteType === "ppf" && (
        <div key={`trim-${noteType}`}>
          <label htmlFor="trim_package" className="block text-sm font-medium text-text-muted mb-1">
            Trim Package <span className="text-text-dim">(optional)</span>
          </label>
          <input
            id="trim_package"
            name="trim_package"
            type="text"
            defaultValue={activeExisting?.trim_package ?? ""}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            placeholder="e.g. Sport, Limited, Platinum, Base..."
          />
          <p className="text-xs text-text-dim mt-1">
            Trim matters — bumpers, fenders, and hoods can vary significantly between packages.
          </p>
        </div>
      )}

      {/* Form body — keyed to noteType so defaultValues reset on type switch */}
      <div key={noteType} className="flex flex-col gap-6">
        {/* General tips */}
        <div>
          <label htmlFor="general_tips" className="block text-sm font-medium text-text-muted mb-1">
            General Install Tips <span className="text-primary">*</span>
          </label>
          <textarea
            id="general_tips"
            name="general_tips"
            required
            minLength={20}
            rows={5}
            defaultValue={activeExisting?.general_tips ?? ""}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-y"
            placeholder="Share your tips for installing on this vehicle. What should other installers know? (min 20 characters)"
          />
        </div>

        {/* Tools needed */}
        <div>
          <label htmlFor="tools_needed" className="block text-sm font-medium text-text-muted mb-1">
            Tools Needed <span className="text-text-dim">(optional)</span>
          </label>
          <textarea
            id="tools_needed"
            name="tools_needed"
            rows={3}
            defaultValue={activeExisting?.tools_needed ?? ""}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-y"
            placeholder="Any specific tools that make this install easier?"
          />
        </div>

        {/* Common problems */}
        <div>
          <label htmlFor="common_problems" className="block text-sm font-medium text-text-muted mb-1">
            Common Problems <span className="text-text-dim">(optional)</span>
          </label>
          <textarea
            id="common_problems"
            name="common_problems"
            rows={3}
            defaultValue={activeExisting?.common_problems ?? ""}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-y"
            placeholder="What issues come up most often?"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Photos <span className="text-text-dim">(optional, up to {MAX_PHOTOS})</span>
          </label>

          {(keptPhotos.length > 0 || newPhotos.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {keptPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={storageUrl(photo.storage_path)}
                    alt=""
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removeKept(photo.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    x
                  </button>
                </div>
              ))}
              {previews.map((url, i) => (
                <div key={`new-${i}`} className="relative group">
                  <img
                    src={url}
                    alt=""
                    className="w-20 h-20 object-cover rounded-lg border border-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => removeNew(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          {totalPhotos < MAX_PHOTOS && (
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-primary hover:text-primary/80 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Photo{totalPhotos > 0 ? ` (${totalPhotos}/${MAX_PHOTOS})` : ""}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleAddPhotos}
                className="hidden"
              />
            </label>
          )}
          {totalPhotos >= MAX_PHOTOS && (
            <p className="text-xs text-text-dim">Maximum {MAX_PHOTOS} photos reached</p>
          )}
        </div>

        {/* YouTube URL */}
        <div>
          <label htmlFor="youtube_url" className="block text-sm font-medium text-text-muted mb-1">
            YouTube Video <span className="text-text-dim">(optional)</span>
          </label>
          <input
            id="youtube_url"
            name="youtube_url"
            type="url"
            defaultValue={activeExisting?.youtube_url ?? ""}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>

        {/* Facebook URL */}
        <div>
          <label htmlFor="facebook_url" className="block text-sm font-medium text-text-muted mb-1">
            Facebook Post or Video <span className="text-text-dim">(optional)</span>
          </label>
          <input
            id="facebook_url"
            name="facebook_url"
            type="url"
            defaultValue={activeExisting?.facebook_url ?? ""}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            placeholder="https://facebook.com/..."
          />
        </div>

        {/* Difficulty ratings */}
        <DifficultyPicker noteType={noteType} defaults={activeDifficulty ?? undefined} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {pending
          ? "Submitting..."
          : isEditing
            ? "Update Note"
            : "Submit Note"}
      </button>
    </form>
  );
}
