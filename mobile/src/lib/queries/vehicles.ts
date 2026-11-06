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

function applyTokens<T extends { or: (f: string) => T }>(qb: T, query: string): T {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    const yearNum = parseInt(token, 10);
    const pattern = `%${token}%`;
    if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
      qb = qb.or(`year.eq.${yearNum},make.ilike.${pattern},model.ilike.${pattern}`);
    } else {
      qb = qb.or(`make.ilike.${pattern},model.ilike.${pattern}`);
    }
  }
  return qb;
}

/** One row per vehicle group with its full year range — same as the website search. */
export async function searchVehiclesGrouped(query: string): Promise<VehicleGroup[]> {
  if (!query || query.trim().length < 2) return [];

  let qb = supabase
    .from("vehicle_catalog")
    .select("year, make, model, body_type_alt, body_type, group_id")
    .order("make")
    .order("model")
    .order("year", { ascending: false })
    .limit(100);
  qb = applyTokens(qb, query);

  const { data: matched, error } = await qb;
  if (error) throw error;
  if (!matched || matched.length === 0) return [];

  const ordered: string[] = [];
  const seen = new Set<string>();
  for (const row of matched) {
    if (row.group_id && !seen.has(row.group_id)) {
      seen.add(row.group_id);
      ordered.push(row.group_id);
    }
  }

  const { data: all } = await supabase
    .from("vehicle_catalog")
    .select("group_id, year, make, model, body_type_alt, body_type")
    .in("group_id", ordered);

  const map = new Map<string, VehicleGroup>();
  for (const e of all ?? []) {
    if (!e.group_id) continue;
    const cur = map.get(e.group_id);
    if (!cur) {
      map.set(e.group_id, {
        group_id: e.group_id,
        make: e.make,
        model: e.model,
        body_type_alt: e.body_type_alt,
        body_type: e.body_type,
        minYear: e.year,
        maxYear: e.year,
      });
    } else {
      if (e.year < cur.minYear) cur.minYear = e.year;
      if (e.year > cur.maxYear) cur.maxYear = e.year;
    }
  }

  return ordered
    .slice(0, 15)
    .map((g) => map.get(g))
    .filter((g): g is VehicleGroup => !!g);
}

export type Vehicle = {
  groupId: string;
  make: string;
  model: string;
  bodyType: string;
  bodyTypeAlt: string;
  generation: number;
  yearRange: string;
  label: string;
};

export async function getVehicle(groupId: string): Promise<Vehicle | null> {
  if (!groupId) return null;
  const { data, error } = await supabase
    .from("vehicle_catalog")
    .select("id, year, make, model, body_type_alt, body_type, generation, group_id")
    .eq("group_id", groupId)
    .order("year", { ascending: false });
  if (error) throw error;
  if (!data || data.length === 0) return null;

  const first = data[0];
  const range = yearRange(data.map((d) => d.year));
  return {
    groupId,
    make: first.make,
    model: first.model,
    bodyType: first.body_type,
    bodyTypeAlt: first.body_type_alt,
    generation: first.generation,
    yearRange: range,
    label: `${range} ${first.make} ${first.model} ${first.body_type_alt}`.trim(),
  };
}

/** group_id → "2017–2023 Make Model — Body" for a set of groups. */
export async function vehicleLabels(groupIds: string[]): Promise<Record<string, string>> {
  const ids = [...new Set(groupIds)];
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from("vehicle_catalog")
    .select("group_id, year, make, model, body_type_alt")
    .in("group_id", ids);
  const acc: Record<string, { make: string; model: string; body: string; years: number[] }> = {};
  for (const v of data ?? []) {
    if (!v.group_id) continue;
    (acc[v.group_id] ??= { make: v.make, model: v.model, body: v.body_type_alt, years: [] }).years.push(v.year);
  }
  const out: Record<string, string> = {};
  for (const [g, v] of Object.entries(acc)) {
    out[g] = `${yearRange(v.years)} ${v.make} ${v.model} — ${v.body}`;
  }
  return out;
}
