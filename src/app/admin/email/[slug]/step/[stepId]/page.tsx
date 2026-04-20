import { redirect } from "next/navigation";

export default async function LegacyStepPage({
  params,
}: {
  params: Promise<{ slug: string; stepId: string }>;
}) {
  const { slug } = await params;
  redirect(`/admin/email/sequences/${slug}`);
}
