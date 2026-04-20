import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VehicleSearch } from "@/components/VehicleSearch";
import { getRecentNotes } from "@/actions/notes";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Vehicles",
  description: "Search any vehicle to find window tint install notes, difficulty ratings, tips, and videos from professional installers.",
};

export default async function SearchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const recentNotes = await getRecentNotes(10);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-text-bright mb-2">Search Vehicles</h1>
      <p className="text-text-muted mb-8">
        Find any vehicle to read install notes or add your own.
      </p>
      <VehicleSearch recentNotes={recentNotes} />
    </div>
  );
}
