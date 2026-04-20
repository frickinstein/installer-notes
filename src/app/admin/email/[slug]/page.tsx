import { redirect } from "next/navigation";

export default async function LegacyCampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/admin/email/sequences/${slug}`);
}
