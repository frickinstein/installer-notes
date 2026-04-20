"use client";

import { useState, useCallback, useEffect } from "react";

export function NotePhotos({ urls }: { urls: string[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);

  const prev = useCallback(() => {
    setOpen((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  const next = useCallback(() => {
    setOpen((i) => (i !== null && i < urls.length - 1 ? i + 1 : i));
  }, [urls.length]);

  useEffect(() => {
    if (open === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, close, prev, next]);

  return (
    <>
      {/* Thumbnail strip */}
      <div className="flex gap-2 mt-3 mb-1 overflow-x-auto">
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(i)}
            className="shrink-0 rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <img
              src={url}
              alt={`Photo ${i + 1}`}
              className="w-16 h-16 object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {open !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={close}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl z-10"
          >
            x
          </button>

          {/* Nav arrows */}
          {open > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl z-10"
            >
              &#8249;
            </button>
          )}
          {open < urls.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl z-10"
            >
              &#8250;
            </button>
          )}

          {/* Image */}
          <img
            src={urls[open]}
            alt={`Photo ${open + 1} of ${urls.length}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Counter */}
          {urls.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {open + 1} / {urls.length}
            </span>
          )}
        </div>
      )}
    </>
  );
}
