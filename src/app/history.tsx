import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import Reanimated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { api } from "../../convex/_generated/api";

import { useTheme, useThemedStyles, type Theme } from "../theme";
import { readableDate } from "../lib/date";
import type { TaskItem } from "../lib/types";

const ACTION_WIDTH = 84;

export default function HistoryScreen() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const router = useRouter();
  const { room, password } = useLocalSearchParams<{
    room: string;
    password?: string;
  }>();

  const currentRoom = room || "sala-demo";
  const response = useQuery(api.todos.getHistoryByRoom, {
    shareCode: currentRoom,
    password: password || undefined,
  });
  const deleteTodo = useMutation(api.todos.deleteTodo);
  const deleteGroup = useMutation(api.todos.deleteGroup);

  const confirmDeleteGroup = (date: string, count: number) => {
    Alert.alert(
      "Vaciar el día",
      `¿Borrar las ${count} notas de ${readableDate(date)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar todo",
          style: "destructive",
          onPress: () =>
            deleteGroup({
              shareCode: currentRoom,
              password: password || undefined,
              date,
            }),
        },
      ]
    );
  };

  if (response === undefined) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (response.status !== "ok") {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>
          {response.status === "unauthorized"
            ? "🔒 Acceso denegado"
            : "Sala no encontrada"}
        </Text>
        <Text style={styles.errorSub}>
          {response.status === "unauthorized"
            ? `Contraseña incorrecta para #${currentRoom}`
            : `No hay nada en #${currentRoom}`}
        </Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.navBack} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.navBackText}>‹ Volver</Text>
        </Pressable>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.room}>#{currentRoom}</Text>
      </View>

      <FlatList
        data={Object.entries(response.history)}
        keyExtractor={([date]) => date}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Aún no hay nada registrado.</Text>
        }
        renderItem={({ item: [date, items] }) => {
          const tasks = items as TaskItem[];
          const completed = tasks.filter((t) => t.done).length;

          return (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionDate}>{readableDate(date)}</Text>
                <View style={styles.sectionRight}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {completed}/{tasks.length}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => confirmDeleteGroup(date, tasks.length)}
                    hitSlop={8}
                    accessibilityLabel={`Borrar todas las notas de ${date}`}
                  >
                    <Text style={styles.sectionDelete}>🗑</Text>
                  </Pressable>
                </View>
              </View>

              {tasks.map((task) => {
                const hasImage = !!(task.imageUrl || task.mediaType === "image");
                const hasAudio = !!(task.audioUrl || task.mediaType === "audio");
                return (
                  <SwipeableRow
                    key={task._id}
                    onDelete={() => deleteTodo({ id: task._id as any })}
                  >
                    <View style={styles.taskRow}>
                      <Text style={[styles.bullet, task.done && styles.bulletDone]}>
                        {task.done ? "✓" : "○"}
                      </Text>
                      <Text
                        style={[styles.taskText, task.done && styles.taskTextDone]}
                        numberOfLines={2}
                      >
                        {task.title}
                        {hasImage ? "  🖼" : ""}
                        {hasAudio ? "  🎙" : ""}
                      </Text>
                      <Text style={styles.author}>{task.createdBy}</Text>
                    </View>
                  </SwipeableRow>
                );
              })}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  return (
    <Swipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={(_progress, drag) => (
        <DeleteAction drag={drag} onDelete={onDelete} />
      )}
    >
      {children}
    </Swipeable>
  );
}

function DeleteAction({
  drag,
  onDelete,
}: {
  drag: SharedValue<number>;
  onDelete: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + ACTION_WIDTH }],
  }));

  return (
    <Reanimated.View style={styles.actionWrap}>
      <Reanimated.View style={[styles.actionInner, animated]}>
        <Pressable style={styles.actionBtn} onPress={onDelete}>
          <Text style={styles.actionIcon}>🗑</Text>
          <Text style={styles.actionLabel}>Borrar</Text>
        </Pressable>
      </Reanimated.View>
    </Reanimated.View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.colors.bg,
      paddingHorizontal: t.spacing.xl,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.md,
      gap: t.spacing.sm,
    },
    navBack: { marginRight: t.spacing.sm },
    navBackText: {
      color: t.colors.accent,
      fontSize: t.font.body,
      fontWeight: "600",
    },
    title: {
      color: t.colors.text,
      fontSize: t.font.heading,
      fontWeight: "800",
      flex: 1,
    },
    room: { color: t.colors.textSecondary, fontSize: t.font.small, fontWeight: "600" },
    list: { paddingHorizontal: t.spacing.lg, paddingBottom: t.spacing.xl },
    section: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.lg,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.md,
      marginBottom: t.spacing.md,
      borderWidth: 0.5,
      borderColor: t.colors.border,
      overflow: "hidden",
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: t.spacing.sm,
    },
    sectionRight: { flexDirection: "row", alignItems: "center", gap: t.spacing.md },
    sectionDate: {
      color: t.colors.text,
      fontSize: t.font.body,
      fontWeight: "700",
      textTransform: "capitalize",
    },
    sectionDelete: { fontSize: 15 },
    badge: {
      backgroundColor: t.colors.surfaceAlt,
      borderRadius: t.radius.pill,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: 2,
    },
    badgeText: {
      color: t.colors.textSecondary,
      fontSize: t.font.tiny,
      fontWeight: "700",
    },
    taskRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      gap: t.spacing.sm,
      backgroundColor: t.colors.surface,
    },
    bullet: { fontSize: 13, color: t.colors.textTertiary, width: 16 },
    bulletDone: { color: t.colors.success, fontWeight: "700" },
    taskText: { flex: 1, fontSize: t.font.small, color: t.colors.text },
    taskTextDone: {
      textDecorationLine: "line-through",
      color: t.colors.textTertiary,
    },
    author: { fontSize: t.font.tiny, color: t.colors.textTertiary },
    empty: {
      textAlign: "center",
      color: t.colors.textSecondary,
      fontSize: t.font.body,
      marginTop: t.spacing.xl,
    },
    errorTitle: {
      color: t.colors.text,
      fontSize: t.font.heading,
      fontWeight: "700",
      marginBottom: t.spacing.sm,
    },
    errorSub: {
      color: t.colors.textSecondary,
      fontSize: t.font.body,
      textAlign: "center",
      marginBottom: t.spacing.lg,
    },
    backBtn: {
      backgroundColor: t.colors.accent,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.sm,
      borderRadius: t.radius.md,
    },
    backBtnText: { color: t.colors.onAccent, fontWeight: "700", fontSize: t.font.small },
    actionWrap: { width: ACTION_WIDTH },
    actionInner: { flex: 1 },
    actionBtn: {
      flex: 1,
      backgroundColor: t.colors.danger,
      justifyContent: "center",
      alignItems: "center",
      gap: 2,
    },
    actionIcon: { fontSize: 16 },
    actionLabel: {
      color: "#fff",
      fontSize: t.font.tiny,
      fontWeight: "700",
    },
  });
