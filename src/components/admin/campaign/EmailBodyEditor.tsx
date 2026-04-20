"use client";

import { useState, useRef } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const DYNAMIC_FIELDS = [
  { value: "{{username_greeting}}", label: "Username greeting" },
  { value: "{{username}}", label: "Username" },
  { value: "{{site_url}}", label: "Site URL" },
];

function ButtonInserter({ onInsert }: { onInsert: (html: string) => void }) {
  const [label, setLabel] = useState("Click Here");
  const [url, setUrl] = useState("{{site_url}}/vehicles");
  const [open, setOpen] = useState(false);

  function insert() {
    const html = `<div style="text-align:center;margin:28px 0">\n  <a href="${url}" style="display:inline-block;background:#E31C23;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.01em">${label}</a>\n</div>`;
    onInsert(html);
    setOpen(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20">
        + Button
      </button>
    );
  }

  return (
    <div className="flex items-end gap-2 bg-surface-hover rounded p-2">
      <div className="flex-1">
        <label className="text-xs text-text-dim">Label</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full bg-surface border border-border rounded px-2 py-1 text-sm text-text" />
      </div>
      <div className="flex-1">
        <label className="text-xs text-text-dim">URL</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full bg-surface border border-border rounded px-2 py-1 text-sm text-text" />
      </div>
      <button onClick={insert} className="px-3 py-1 bg-primary text-white rounded text-xs font-medium">Insert</button>
      <button onClick={() => setOpen(false)} className="px-2 py-1 text-text-muted text-xs">Cancel</button>
    </div>
  );
}

function renderPreview(html: string) {
  return html
    .replace(/\{\{username_greeting\}\}/g, ", Alex")
    .replace(/\{\{username\}\}/g, "Alex")
    .replace(/\{\{site_url\}\}/g, "https://installernotes.com");
}

function wordCount(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

function readTime(words: number): string {
  const mins = Math.ceil(words / 200);
  return mins <= 1 ? "~1 min read" : `~${mins} min read`;
}

export function EmailBodyEditor({
  value,
  onChange,
  campaignName,
  stepPosition,
  onSubjectGenerated,
}: {
  value: string;
  onChange: (v: string) => void;
  campaignName?: string;
  stepPosition?: number;
  onSubjectGenerated?: (subject: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"edit" | "preview" | "split">("edit");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ subject: string; body_html: string } | null>(null);
  const [aiError, setAiError] = useState("");

  function insertAtCursor(text: string) {
    const ta = textareaRef.current;
    if (!ta) {
      onChange(value + text);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = value.substring(0, start) + text + value.substring(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + text.length, start + text.length);
    });
  }

  async function generateEmail() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError("");
    setAiResult(null);

    try {
      const res = await fetch("/api/admin/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          campaignName: campaignName ?? "",
          stepPosition: stepPosition ?? 1,
        }),
      });
      const data = await res.json();
      if (data.error) setAiError(data.error);
      else setAiResult(data);
    } catch {
      setAiError("Failed to generate email.");
    } finally {
      setAiLoading(false);
    }
  }

  const sampleHtml = renderPreview(value);
  const words = wordCount(value);

  const editorPane = (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={12}
      className="w-full h-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text font-mono resize-y min-h-[200px]"
      placeholder="Email body HTML..."
    />
  );

  const previewPane = (
    <div
      className="bg-[#1E293B] border border-[#2D3A4D] rounded-xl p-6 min-h-[200px]"
      dangerouslySetInnerHTML={{ __html: sampleHtml }}
    />
  );

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          onChange={(e) => {
            if (e.target.value) insertAtCursor(e.target.value);
            e.target.value = "";
          }}
          className="bg-surface border border-border rounded px-2 py-1 text-xs text-text"
          defaultValue=""
        >
          <option value="" disabled>Insert field...</option>
          {DYNAMIC_FIELDS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <ButtonInserter onInsert={insertAtCursor} />

        {/* Mode toggles */}
        <div className="flex gap-0.5 bg-surface-hover rounded-lg p-0.5">
          {(["edit", "split", "preview"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                mode === m ? "bg-surface text-text-bright shadow-sm" : "text-text-muted hover:text-text"
              }`}
            >
              {m === "edit" ? "Edit" : m === "split" ? "Split" : "Preview"}
            </button>
          ))}
        </div>

        <span className="text-[10px] text-text-dim ml-1">{words} words &middot; {readTime(words)}</span>

        <button
          onClick={() => setAiOpen(true)}
          className="ml-auto text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded hover:bg-purple-500/20"
        >
          Write with AI
        </button>
      </div>

      {/* Editor / Preview */}
      {mode === "edit" && editorPane}
      {mode === "preview" && previewPane}
      {mode === "split" && (
        <div className="grid grid-cols-2 gap-3">
          <div>{editorPane}</div>
          <div>{previewPane}</div>
        </div>
      )}

      {/* AI Writer Modal */}
      {aiOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold text-text-bright mb-4">Write with AI</h3>

            {!aiResult ? (
              <>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-text resize-y mb-3"
                  placeholder="Describe what this email should be about... e.g. 'Encourage users to write their first note, mention how easy it is and the leaderboard'"
                />
                {aiError && <p className="text-red-400 text-sm mb-3">{aiError}</p>}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setAiOpen(false); setAiError(""); }}
                    className="px-4 py-2 text-sm text-text-muted hover:text-text"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateEmail}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {aiLoading ? "Generating..." : "Generate"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-3">
                  <p className="text-xs text-text-dim mb-1">Subject</p>
                  <p className="text-sm text-text-bright font-medium">{aiResult.subject}</p>
                </div>
                <div className="mb-4">
                  <p className="text-xs text-text-dim mb-1">Preview</p>
                  <div
                    className="bg-[#1E293B] border border-[#2D3A4D] rounded-xl p-6"
                    dangerouslySetInnerHTML={{ __html: renderPreview(aiResult.body_html) }}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setAiResult(null)}
                    className="px-4 py-2 text-sm text-text-muted hover:text-text"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => { setAiOpen(false); setAiResult(null); setAiPrompt(""); }}
                    className="px-4 py-2 text-sm text-text-muted hover:text-text"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onChange(aiResult!.body_html);
                      if (onSubjectGenerated && aiResult!.subject) {
                        onSubjectGenerated(aiResult!.subject);
                      }
                      setAiOpen(false);
                      setAiResult(null);
                      setAiPrompt("");
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
                  >
                    Use This
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
