import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { DifficultyPanel } from "@/components/DifficultyPanel";
import { NoteCard } from "@/components/NoteCard";
import { Button, Empty, Loading, Notice, Pill, Screen, T } from "@/components/ui";
import { useUserId } from "@/lib/auth";
import { getMyNoteForVehicle, getNotesForVehicle } from "@/lib/queries/notes";
import { getVehicle } from "@/lib/queries/vehicles";
import { space } from "@/lib/theme";

export default function VehicleScreen() {
  const { groupId, submitted } = useLocalSearchParams<{ groupId: string; submitted?: string }>();
  const router = useRouter();
  const userId = useUserId();

  const vehicle = useQuery({ queryKey: ["vehicle", groupId], queryFn: () => getVehicle(groupId) });
  const notes = useQuery({ queryKey: ["vehicle-notes", groupId], queryFn: () => getNotesForVehicle(groupId) });
  const mine = useQuery({ queryKey: ["my-note", groupId], queryFn: () => getMyNoteForVehicle(groupId) });

  if (vehicle.isLoading || notes.isLoading) return <Loading />;
  if (!vehicle.data) return <Screen><Empty>Vehicle not found.</Empty></Screen>;

  const v = vehicle.data;
  const list = notes.data ?? [];
  const myStatus = mine.data?.status;
  const addTitle = mine.data ? "Edit your note" : "Add your note";

  return (
    <>
      <Stack.Screen options={{ title: `${v.make} ${v.model}` }} />
      <Screen>
        {submitted === "pending" && <Notice tone="warn">Your note was submitted and is pending approval.</Notice>}
        {submitted === "approved" && <Notice tone="ok">Your note is live.</Notice>}
        {!submitted && myStatus && myStatus !== "approved" && (
          <Notice tone="warn">Your note for this vehicle is {myStatus === "pending" ? "pending approval" : myStatus}.</Notice>
        )}

        <View style={{ gap: space[1] }}>
          <T kind="dim">{v.yearRange}</T>
          <T kind="title">
            {v.make} {v.model}
          </T>
          <Pill>{v.bodyTypeAlt}</Pill>
        </View>

        <DifficultyPanel notes={list} />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <T kind="heading">Tint notes ({list.length})</T>
          <Button title={addTitle} onPress={() => router.push({ pathname: "/submit/[groupId]", params: { groupId } })} style={{ minHeight: 38, paddingVertical: space[2] }} />
        </View>

        {list.length === 0 ? (
          <Empty>No window tint notes for this vehicle yet. Be the first to add one.</Empty>
        ) : (
          list.map((n) => <NoteCard key={n.id} note={n} currentUserId={userId} />)
        )}
      </Screen>
    </>
  );
}
