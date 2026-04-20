import { listEmailLists } from "@/actions/admin";
import { ListsClient } from "@/components/admin/campaign/ListsClient";

export default async function EmailListsPage() {
  const lists = await listEmailLists();

  return <ListsClient initialLists={lists} />;
}
