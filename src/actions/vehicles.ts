"use server";

import { createClient } from "@/lib/supabase/server";

// The vehicle catalog is shared with SnapTip and is read ONLY through its
// metered database functions (SnapTip migration 265, card
// `platform/vehicle-catalog-meter` in that repo). Never query
// `vehicle_catalog` directly from a signed-in user's client: once SnapTip
// migration 266 is applied a direct read returns nothing, silently.
//   vehicle_catalog_group_search(p_query)  metered; up to 6 groups per search
//   vehicle_catalog_groups(p_group_ids)    by group id; not metered

type CatalogGroup = {
  group_id: string;
  make: string;
  model: string;
  body_type: string;
  body_types: string[];
  year_start: number;
  year_end: number;
};

export async function getVehicleByGroupId(groupId: string) {
  if (!groupId) return null;

  const supabase = await createClient();
  const { data } = await supabase.rpc("vehicle_catalog_groups", { p_group_ids: [groupId] });
  const g = ((data ?? []) as CatalogGroup[])[0];
  if (!g) return null;

  return {
    groupId: g.group_id,
    make: g.make,
    model: g.model,
    bodyType: g.body_type,
    bodyTypeAlt: (g.body_types ?? []).join(" / "),
    yearRange: g.year_start === g.year_end ? `${g.year_start}` : `${g.year_start}–${g.year_end}`,
  };
}

// Grouped search: one result per group_id with the full year range, so users
// see "2017–2023 <make> <model>" instead of a separate row per year.
// `limited` is true when today's allowance for new vehicles ran out; groups a
// person has already looked up keep coming back.
export async function searchVehicleCatalogGrouped(query: string) {
  if (!query || query.trim().length < 2) return { results: [], limited: false };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("vehicle_catalog_group_search", { p_query: query });
  if (error || !data) return { results: [], limited: false };

  const payload = data as { groups?: CatalogGroup[]; limited?: boolean };
  return {
    results: (payload.groups ?? []).map((g) => ({
      group_id: g.group_id,
      make: g.make,
      model: g.model,
      body_type_alt: (g.body_types ?? []).join(" / "),
      body_type: g.body_type,
      minYear: g.year_start,
      maxYear: g.year_end,
    })),
    limited: payload.limited === true,
  };
}
