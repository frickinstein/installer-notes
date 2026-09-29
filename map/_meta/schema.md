# Schema — the rules of this map

Closed set of node types, the labels they carry, and the naming they follow. Adapted from the
icm-architect `schema.md` template for the system-map form. When practice and this file
disagree, reconcile the same day — schema drift is how maps rot.

## Node types

| `type:` | Lives at | Carries |
|---|---|---|
| object | `objects/<cluster>/<slug>.md` | one sentence / why this shape / shape + citations / connected to / Hits + Does not hit / surfaces / see |
| process | `processes/<slug>.md` (slice 3, not yet) | Input → Movement → Output, numbered cited steps, `consumes` / `produces` links |
| effects-index | `effects/CONTEXT.md` (slice 4, not yet) | "if you are changing X, open these cards" — a catalog, never a copied waterfall |

## Labels that make it queryable

- `type`: object | process
- `cluster`: notes | people | vehicles | email
- `universe`: live | leftover | ghost (meanings in `../CLAUDE.md`)
- `status`: stub | verified | stale — `verified` only with a date, a commit, and `path:line` citations
- `shared`: true on the two SnapTip-owned nouns (`profiles`, `vehicle_catalog`) — a card with `shared: true` never proposes a migration
- `entity`: the owning file (a `src/actions/` module, a route, or the schema snapshot)
- `consumes:` / `produces:` on processes: relative links to object cards

## Naming

- Slugs: kebab-case, named after the table or module (`installer-note-media.md`, `email-campaign-sends.md`).
- Cluster folders are created when their first card is written, not before.
- `_meta/` holds the rules (this file). `objects/_index.md` is hand-maintained in slice 1; once
  cards exist it is rebuilt from card frontmatter, never hand-edited.
