import { listEmailLists } from "@/actions/admin";
import { BroadcastPanel } from "@/components/admin/campaign/BroadcastPanel";

export default async function BroadcastPage() {
  const lists = await listEmailLists();
  return <BroadcastPanel lists={lists} />;
}
