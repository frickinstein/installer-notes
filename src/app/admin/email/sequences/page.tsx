import { listCampaigns, listEmailLists } from "@/actions/admin";
import { SequencesClient } from "@/components/admin/campaign/SequencesClient";

export default async function SequencesPage() {
  const [campaigns, lists] = await Promise.all([listCampaigns(), listEmailLists()]);
  return <SequencesClient initialCampaigns={campaigns} lists={lists} />;
}
