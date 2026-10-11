import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { Image } from "expo-image";

import { AudioPlayer } from "./AudioPlayer";
import { haptics } from "../../lib/haptics";
import { useThemedStyles, type Theme } from "../../theme";
import type { TaskItem } from "../../lib/types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  item: TaskItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenImage: (url: string) => void;
}

export function TaskCard({ item, onToggle, onDelete, onOpenImage }: Props) {
  const styles = useThemedStyles(makeStyles);

  const imageUrl =
    item.imageUrl ?? (item.mediaType === "image" ? item.mediaUrl : null);
  const audioUrl =
    item.audioUrl ?? (item.mediaType === "audio" ? item.mediaUrl : null);
  const hasText = item.title.trim().length > 0;

  const pop = useSharedValue(1);
  const check = useSharedValue(item.done ? 1 : 0);

  useEffect(() => {
    if (item.done) {
      pop.value = withSequence(
        withSpring(1.28, { damping: 9, stiffness: 320 }),
        withSpring(1, { damping: 12, stiffness: 260 })
      );
      check.value = withSpring(1, { damping: 12, stiffness: 240 });
    } else {
      check.value = withSpring(0, { damping: 14, stiffness: 260 });
    }
  }, [item.done, pop, check]);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: check.value,
    transform: [{ scale: check.value }],
  }));

  const handleToggle = () => {
    haptics.select();
    onToggle(item._id);
  };

  const handleDelete = () => {
    haptics.warn();
    onDelete(item._id);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      style={[styles.card, item.done && styles.cardDone]}
    >
      <AnimatedPressable
        style={[styles.checkbox, item.done && styles.checkboxDone, boxStyle]}
        onPress={handleToggle}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: !!item.done }}
        accessibilityLabel={item.done ? "Marcar como pendiente" : "Marcar como hecha"}
      >
        <Animated.Text style={[styles.checkText, checkStyle]}>✓</Animated.Text>
      </AnimatedPressable>

      <View style={styles.content}>
        {hasText && (
          <Text style={[styles.title, item.done && styles.titleDone]}>
            {item.title}
          </Text>
        )}

        {imageUrl ? (
          <Pressable onPress={() => onOpenImage(imageUrl)}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={150}
            />
            <View style={styles.imageHint}>
              <Text style={styles.imageHintText}>Ver foto</Text>
            </View>
          </Pressable>
        ) : null}

        {audioUrl ? (
          <AudioPlayer url={audioUrl} durationMs={item.audioDurationMs} />
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.meta}>{item.createdBy}</Text>
          <Pressable
            onPress={handleDelete}
            hitSlop={10}
            accessibilityLabel="Eliminar nota"
          >
            <Text style={styles.delete}>Eliminar</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.lg,
      padding: t.spacing.md,
      marginBottom: t.spacing.sm,
      borderWidth: 0.5,
      borderColor: t.colors.border,
      alignItems: "flex-start",
    },
    cardDone: { opacity: 0.55 },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: t.radius.pill,
      borderWidth: 1.5,
      borderColor: t.colors.textTertiary,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 1,
      marginRight: t.spacing.md,
    },
    checkboxDone: {
      backgroundColor: t.colors.success,
      borderColor: t.colors.success,
    },
    checkText: { color: t.colors.onAccent, fontSize: 13, fontWeight: "800" },
    content: { flex: 1 },
    title: { fontSize: t.font.body, color: t.colors.text, lineHeight: 21 },
    titleDone: {
      textDecorationLine: "line-through",
      color: t.colors.textSecondary,
    },
    thumbnail: {
      width: "100%",
      height: 190,
      borderRadius: t.radius.md,
      marginTop: t.spacing.sm,
      backgroundColor: t.colors.surfaceAlt,
    },
    imageHint: {
      position: "absolute",
      bottom: t.spacing.sm,
      right: t.spacing.sm,
      backgroundColor: t.colors.hintBg,
      borderRadius: t.radius.pill,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: 3,
    },
    imageHintText: { color: "#FFFFFF", fontSize: 10, fontWeight: "600" },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: t.spacing.sm,
    },
    meta: {
      fontSize: t.font.tiny,
      color: t.colors.textTertiary,
      fontWeight: "600",
    },
    delete: { fontSize: t.font.tiny, color: t.colors.danger, fontWeight: "700" },
  });
