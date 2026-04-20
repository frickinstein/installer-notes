"use server";

import { createClient } from "@/lib/supabase/server";

export async function getVehicleMakes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicle_catalog")
    .select("make")
    .order("make");

  if (!data) return [];

  const seen = new Set<string>();
  return data.reduce<string[]>((acc, row) => {
    if (!seen.has(row.make)) {
      seen.add(row.make);
      acc.push(row.make);
    }
    return acc;
  }, []);
}

export async function getVehicleModels(make: string) {
  if (!make) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicle_catalog")
    .select("model")
    .eq("make", make)
    .order("model");

  if (!data) return [];

  const seen = new Set<string>();
  return data.reduce<string[]>((acc, row) => {
    if (!seen.has(row.model)) {
      seen.add(row.model);
      acc.push(row.model);
    }
    return acc;
  }, []);
}

export async function getVehicleYears(make: string, model: string) {
  if (!make || !model) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicle_catalog")
    .select("year, body_type_alt")
    .eq("make", make)
    .eq("model", model)
    .order("year", { ascending: false });

  if (!data) return [];

  const seen = new Set<string>();
  return data.reduce<{ year: number; body_type_alt: string }[]>((acc, row) => {
    const key = `${row.year}-${row.body_type_alt}`;
    if (!seen.has(key)) {
      seen.add(key);
      acc.push({ year: row.year, body_type_alt: row.body_type_alt });
    }
    return acc;
  }, []);
}

export async function getVehicleByGroupId(groupId: string) {
  if (!groupId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicle_catalog")
    .select("id, year, make, model, body_type_alt, body_type, generation, group_id")
    .eq("group_id", groupId)
    .order("year", { ascending: false });

  if (!data || data.length === 0) return null;

  const first = data[0];
  const years = data.map((d) => d.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  return {
    groupId: first.group_id,
    make: first.make,
    model: first.model,
    bodyType: first.body_type,
    bodyTypeAlt: first.body_type_alt,
    generation: first.generation,
    yearRange: minYear === maxYear ? `${minYear}` : `${minYear}–${maxYear}`,
    entries: data,
  };
}

export async function resolveGroupId(
  make: string,
  model: string,
  year: number,
  bodyTypeAlt: string
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicle_catalog")
    .select("group_id")
    .eq("make", make)
    .eq("model", model)
    .eq("year", year)
    .eq("body_type_alt", bodyTypeAlt)
    .single();

  return data?.group_id ?? null;
}

export async function searchVehicleCatalog(query: string) {
  if (!query || query.length < 2) return [];

  const supabase = await createClient();
  const tokens = query.trim().split(/\s+/).filter(Boolean);

  let qb = supabase
    .from("vehicle_catalog")
    .select("id, year, make, model, body_type_alt, body_type, generation, group_id")
    .order("make")
    .order("model")
    .order("year", { ascending: false })
    .limit(20);

  for (const token of tokens) {
    const yearNum = parseInt(token, 10);
    if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
      const pattern = `%${token}%`;
      qb = qb.or(`year.eq.${yearNum},make.ilike.${pattern},model.ilike.${pattern}`);
    } else {
      const pattern = `%${token}%`;
      qb = qb.or(`make.ilike.${pattern},model.ilike.${pattern}`);
    }
  }

  const { data } = await qb;
  return data ?? [];
}

// Grouped search — returns one result per group_id with the full year range.
// Used by Installer Notes vehicle search so users see "2017–2023 Tesla Model 3"
// instead of a separate row per year.
export async function searchVehicleCatalogGrouped(query: string) {
  if (!query || query.length < 2) return [];

  const supabase = await createClient();
  const tokens = query.trim().split(/\s+/).filter(Boolean);

  // Step 1: find matching rows (higher limit so we don't miss any group_ids)
  let qb = supabase
    .from("vehicle_catalog")
    .select("year, make, model, body_type_alt, body_type, group_id")
    .order("make")
    .order("model")
    .order("year", { ascending: false })
    .limit(100);

  for (const token of tokens) {
    const yearNum = parseInt(token, 10);
    if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
      const pattern = `%${token}%`;
      qb = qb.or(`year.eq.${yearNum},make.ilike.${pattern},model.ilike.${pattern}`);
    } else {
      const pattern = `%${token}%`;
      qb = qb.or(`make.ilike.${pattern},model.ilike.${pattern}`);
    }
  }

  const { data: matchedRows } = await qb;
  if (!matchedRows || matchedRows.length === 0) return [];

  // Step 2: collect unique group_ids in the order they first appeared
  const orderedGroupIds: string[] = [];
  const seenGroups = new Set<string>();
  for (const row of matchedRows) {
    if (!seenGroups.has(row.group_id)) {
      seenGroups.add(row.group_id);
      orderedGroupIds.push(row.group_id);
    }
  }

  // Step 3: fetch ALL years for those group_ids to compute accurate year ranges
  const { data: allGroupEntries } = await supabase
    .from("vehicle_catalog")
    .select("group_id, year, make, model, body_type_alt, body_type")
    .in("group_id", orderedGroupIds);

  // Build a map of group_id → year range + display info
  const groupMap = new Map<string, {
    group_id: string;
    make: string;
    model: string;
    body_type_alt: string;
    body_type: string;
    minYear: number;
    maxYear: number;
  }>();

  for (const entry of allGroupEntries ?? []) {
    const existing = groupMap.get(entry.group_id);
    if (!existing) {
      groupMap.set(entry.group_id, {
        group_id:     entry.group_id,
        make:         entry.make,
        model:        entry.model,
        body_type_alt: entry.body_type_alt,
        body_type:    entry.body_type,
        minYear:      entry.year,
        maxYear:      entry.year,
      });
    } else {
      if (entry.year < existing.minYear) existing.minYear = entry.year;
      if (entry.year > existing.maxYear) existing.maxYear = entry.year;
    }
  }

  // Return results in relevance order (order of first match), up to 15 groups
  return orderedGroupIds
    .slice(0, 15)
    .map((gid) => groupMap.get(gid))
    .filter(Boolean) as Array<{
      group_id: string;
      make: string;
      model: string;
      body_type_alt: string;
      body_type: string;
      minYear: number;
      maxYear: number;
    }>;
}
