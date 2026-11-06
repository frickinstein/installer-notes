// Why a note gets reported. Shared by the action (validation) and the form;
// the phone app carries its own copy in mobile/src/lib/queries/notes.ts.
export const NOTE_REPORT_REASONS = [
  "Inaccurate or incorrect information",
  "Spam or promotional",
  "Inappropriate or offensive",
  "Dangerous or harmful advice",
  "Other",
] as const;
