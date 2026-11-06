import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button, Input, Notice, Screen, T } from "@/components/ui";
import { submitRating } from "@/lib/queries/ratings";
import { colors, space } from "@/lib/theme";

export default function RateScreen() {
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rate = useMutation({
    mutationFn: () => submitRating(noteId, stars, review),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["vehicle-notes"] });
      router.back();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Screen>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <T kind="label">Your rating</T>
      <View style={{ flexDirection: "row", gap: space[2] }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setStars(n)} accessibilityRole="button" accessibilityLabel={`${n} stars`} hitSlop={6}>
            <Text style={{ fontSize: 36, color: n <= stars ? colors.yellow : colors.textDim }}>★</Text>
          </Pressable>
        ))}
      </View>
      <Input
        label="Review"
        value={review}
        onChangeText={setReview}
        multiline
        maxLength={1000}
        placeholder="Was this note accurate? What helped?"
        hint={`${review.length}/1000`}
      />
      <Button title="Submit rating" onPress={() => rate.mutate()} loading={rate.isPending} disabled={stars === 0 || review.trim().length === 0} />
    </Screen>
  );
}
