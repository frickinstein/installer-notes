import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVehicleByGroupId } from "@/actions/vehicles";
import { getNotesForVehicle } from "@/actions/notes";
import { getVehicleRequestInfo } from "@/actions/requests";
import { getSiteType } from "@/lib/site";
import { VehicleTabs } from "@/components/VehicleTabs";
import { RequestInfoButton } from "@/components/RequestInfoButton";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ groupId: string }>;
}): Promise<Metadata> {
  const { groupId } = await params;
  const vehicle = await getVehicleByGroupId(groupId);

  if (!vehicle) {
    return { title: "Vehicle Not Found" };
  }

  const title = `${vehicle.yearRange} ${vehicle.make} ${vehicle.model} Window Tint & PPF Install Notes`;
  const description = `Real-world window tint and PPF install tips, difficulty ratings, photos, and videos for the ${vehicle.yearRange} ${vehicle.make} ${vehicle.model} ${vehicle.bodyTypeAlt}. Community notes from professional installers.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function VehiclePage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams?: { submitted_for_review?: string };
}) {
  const { groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [vehicle, notes, requestInfo, siteType] = await Promise.all([
    getVehicleByGroupId(groupId),
    getNotesForVehicle(groupId),
    getVehicleRequestInfo(groupId),
    getSiteType(),
  ]);

  if (!vehicle) notFound();

  // Vehicles with no notes are only visible to signed-in users
  if (notes.length === 0 && !user) {
    redirect("/login");
  }

  const vehicleLabel = `${vehicle.yearRange} ${vehicle.make} ${vehicle.model} ${vehicle.bodyTypeAlt}`.trim();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {searchParams?.submitted_for_review === "1" && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          Your note was submitted and is pending approval.
        </div>
      )}
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${vehicle.yearRange} ${vehicle.make} ${vehicle.model} Window Tint & PPF Install Notes`,
            description: `Install tips and difficulty ratings for the ${vehicle.yearRange} ${vehicle.make} ${vehicle.model} ${vehicle.bodyTypeAlt}.`,
            author: { "@type": "Organization", name: "Installer Notes Community" },
            publisher: { "@type": "Organization", name: "Installer Notes" },
            mainEntityOfPage: { "@type": "WebPage" },
          }),
        }}
      />

      {/* Vehicle header */}
      <div className="mb-8">
        <p className="text-sm text-text-dim mb-1">{vehicle.yearRange}</p>
        <h1 className="text-3xl font-black text-text-bright">
          {vehicle.make} {vehicle.model}
        </h1>
        <div className="flex items-center justify-between gap-4 mt-2 flex-wrap">
          <span className="text-sm bg-surface border border-border rounded-full px-3 py-1 text-text-muted">
            {vehicle.bodyTypeAlt}
          </span>
          <RequestInfoButton
            groupId={groupId}
            vehicleLabel={vehicleLabel}
            requestInfo={requestInfo}
            isLoggedIn={!!user}
          />
        </div>
      </div>

      {/* Tabbed notes (Tint / PPF) with difficulty panel inside */}
      <VehicleTabs
        notes={notes}
        currentUserId={user?.id ?? null}
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
        groupId={groupId}
        defaultTab={siteType ?? undefined}
      />
    </div>
  );
}
