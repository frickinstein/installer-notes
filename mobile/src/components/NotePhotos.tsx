import { Image } from "expo-image";
import { useState } from "react";
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, space } from "@/lib/theme";

export function NotePhotos({ urls }: { urls: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const width = Dimensions.get("window").width;
  if (urls.length === 0) return null;

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2] }}>
        {urls.map((url, i) => (
          <Pressable key={url} onPress={() => setOpen(i)} accessibilityRole="imagebutton" accessibilityLabel={`Photo ${i + 1}`}>
            <Image source={{ uri: url }} style={styles.thumb} contentFit="cover" transition={150} />
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={open !== null} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <View style={styles.backdrop}>
          <Pressable style={styles.close} onPress={() => setOpen(null)} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={{ color: colors.white, fontSize: 28 }}>×</Text>
          </Pressable>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: (open ?? 0) * width, y: 0 }}
          >
            {urls.map((url) => (
              <View key={url} style={{ width, justifyContent: "center" }}>
                <Image source={{ uri: url }} style={{ width, height: "80%" }} contentFit="contain" />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 72, height: 72, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)" },
  close: { position: "absolute", top: 48, right: 20, zIndex: 2, padding: space[2] },
});
