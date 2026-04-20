import { notFound } from "next/navigation";
import { getEmailList } from "@/actions/admin";
import { ListDetailClient } from "@/components/admin/campaign/ListDetailClient";

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const list = await getEmailList(slug);
  if (!list) notFound();

  return <ListDetailClient list={list} />;
}
