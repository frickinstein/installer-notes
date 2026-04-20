export const NOTIFICATION_TYPES = [
  { key: "new_rating",          label: "New rating on your note",           description: "When someone rates or reviews one of your installation notes", defaultEmail: true },
  { key: "note_approved",       label: "Note approved",                     description: "When your submitted note is approved by a moderator", defaultEmail: true },
  { key: "note_rejected",       label: "Note rejected",                     description: "When your submitted note is rejected by a moderator", defaultEmail: true },
  { key: "vehicle_info_request_tint", label: "Tint install requests",       description: "When a member requests tint install info on a vehicle you may know — sent only to tint contributors", defaultEmail: false },
  { key: "vehicle_info_request_ppf",  label: "PPF install requests",        description: "When a member requests PPF install info on a vehicle you may know — sent only to PPF contributors", defaultEmail: false },
  { key: "vehicle_note_posted", label: "Note posted on requested vehicle",  description: "When someone posts a note on a vehicle you requested info about", defaultEmail: true },
] as const;
