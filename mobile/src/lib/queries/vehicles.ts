import { supabase } from "../supabase";
import { yearRange } from "../validation";

export type VehicleGroup = {
  group_id: string;
  make: string;
  model: string;
  body_type_alt: string;
  body_type: string;
  minYear: number;
  maxYear: number;
};

// The vehicle catalog is shared with SnapTip and is read ONLY through its
// metered database functions (SnapTip migration 265). Never query
// `vehicle_catalog` from the app: once SnapTip migration 266 is applied a
// direct read returns nothing, silently.
type CatalogGroup = {
  group_id: string;
  make: string;
  model: string;
  body_type: string;
  body_types: string[];
  year_start: number;
  year_end: number;
};

const bodyLabel = (g: CatalogGroup) => (g.body_types ?? []).join(" / ");
const rangeOf = (g: CatalogGroup) => yearRange([g.year_start, g.year_end]);

async function groupsById(groupIds: string[]): Promise<CatalogGroup[]> {
  const ids = [...new Set(groupIds.filter(Boolean))];
  if (ids.length === 0) return [];
  const { data, error } = await supabase.rpc("vehicle_catalog_groups", { p_group_ids: ids });
  if (error) throw error;
  return (data ?? []) as CatalogGroup[];
}

export type VehicleSearch = { results: VehicleGroup[]; limited: boolean };

/** One row per vehicle group with its full year range, same as the website
 *  search. `limited` is true when today's allowance for new vehicles ran out. */
export async function searchVehiclesGrouped(query: string): Promise<VehicleSearch> {
  if (!query || query.trim().length < 2) return { results: [], limited: false };

  const { data, error } = await supabase.rpc("vehicle_catalog_group_search", { p_query: query });
  if (error) throw error;
  const payload = (data ?? {}) as { groups?: CatalogGroup[]; limited?: boolean };
  return {
    results: (payload.groups ?? []).map((g) => ({
      group_id: g.group_id,
      make: g.make,
      model: g.model,
      body_type_alt: bodyLabel(g),
      body_type: g.body_type,
      minYear: g.year_start,
      maxYear: g.year_end,
    })),
    limited: payload.limited === true,
  };
}

export type Vehicle = {
  groupId: string;
  make: string;
  model: string;
  bodyType: string;
  bodyTypeAlt: string;
  yearRange: string;
  label: string;
};

export async function getVehicle(groupId: string): Promise<Vehicle | null> {
  if (!groupId) return null;
  const [g] = await groupsById([groupId]);
  if (!g) return null;
  const range = rangeOf(g);
  return {
    groupId,
    make: g.make,
    model: g.model,
    bodyType: g.body_type,
    bodyTypeAlt: bodyLabel(g),
    yearRange: range,
    label: `${range} ${g.make} ${g.model} ${bodyLabel(g)}`.trim(),
  };
}

/** group_id → "2017–2023 Make Model — Body" for a set of groups. */
export async function vehicleLabels(groupIds: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  try {
    for (const g of await groupsById(groupIds)) {
      out[g.group_id] = `${rangeOf(g)} ${g.make} ${g.model} — ${bodyLabel(g)}`;
    }
  } catch {
    // Labels are decoration; a failed lookup leaves them blank.
  }
  return out;
}
