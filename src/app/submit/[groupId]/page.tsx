import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVehicleByGroupId } from "@/actions/vehicles";
import { getUserNotesForVehicle } from "@/actions/notes";
import { getSiteType } from "@/lib/site";
import { NoteForm } from "@/components/NoteForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Note — Installer Notes",
};

export default async function SubmitNotePage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { groupId } = await params;
  const { type } = await searchParams;

  const [vehicle, { tintNote, ppfNote }, siteType] = await Promise.all([
    getVehicleByGroupId(groupId),
    getUserNotesForVehicle(groupId),
    getSiteType(),
  ]);

  if (!vehicle) notFound();

  // Domain takes priority; query param is the fallback (used by edit links on the main site)
  const defaultType: "tint" | "ppf" = siteType ?? (type === "ppf" ? "ppf" : "tint");

  const hasExisting = !!(tintNote || ppfNote);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-text-bright mb-2">
        {hasExisting ? "Edit Your Note" : "Add a Note"}
      </h1>
      <p className="text-text-muted mb-8">
        {vehicle.yearRange} {vehicle.make} {vehicle.model} ({vehicle.bodyTypeAlt})
      </p>

      <div className="bg-surface border border-border rounded-xl p-6">
        <NoteForm
          groupId={groupId}
          vehicleName={`${vehicle.yearRange} ${vehicle.make} ${vehicle.model}`}
          existingTintNote={tintNote ?? undefined}
          existingPpfNote={ppfNote ?? undefined}
          defaultType={defaultType}
          supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
        />
      </div>
    </div>
  );
}
