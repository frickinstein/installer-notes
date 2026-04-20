import { listCampaigns, getCampaignSteps, getCampaignStats } from "@/actions/admin";
import { SequenceDetailClient } from "@/components/admin/campaign/SequenceDetailClient";
import { notFound } from "next/navigation";

export default async function SequenceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [campaigns, steps, stats] = await Promise.all([
    listCampaigns(),
    getCampaignSteps(slug),
    getCampaignStats(slug),
  ]);

  const campaign = campaigns.find((c) => c.name === slug);
  if (!campaign) notFound();

  return <SequenceDetailClient campaign={campaign} initialSteps={steps} initialStats={stats} />;
}
