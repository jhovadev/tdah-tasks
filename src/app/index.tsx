import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { fetch as expoFetch } from "expo/fetch";
import { File } from "expo-file-system";
import { api } from "../../convex/_generated/api";

import { RoomHeader } from "../components/journal/RoomHeader";
import { DateStrip } from "../components/journal/DateStrip";
import { TaskInput, type NewTaskPayload } from "../components/journal/TaskInput";
import { TaskCard } from "../components/journal/TaskCard";
import { ImageViewer } from "../components/journal/ImageViewer";
import { useTheme, useThemedStyles, type Theme } from "../theme";
import { readableDate, toISODate } from "../lib/date";
import { confirmAction, notify } from "../lib/dialog";
import type { TaskItem } from "../lib/types";

// Altura del teclado en Android (edge-to-edge no redimensiona la ventana),
// para subir el compositor por encima del teclado en Expo Go.
function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) =>
      setHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener("keyboardDidHide", () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

export default function JournalApp() {
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const keyboardHeight = useKeyboardHeight();

  const [roomInput, setRoomInput] = useState("sala-demo");
  const [activeRoom, setActiveRoom] = useState("sala-demo");
  const [passwordInput, setPasswordInput] = useState("");
  const [activePassword, setActivePassword] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [copied, setCopied] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const response = useQuery(api.todos.getListByCodeAndDate, {
    shareCode: activeRoom,
    date: selectedDate,
    password: activePassword || undefined,
  });

  const toggleTodo = useMutation(api.todos.toggleTodo);
  const deleteTodo = useMutation(api.todos.deleteTodo);
  const addTodo = useMutation(api.todos.addTodo);
  const generateUploadUrl = useMutation(api.todos.generateUploadUrl);
  const ensureList = useMutation(api.todos.ensureList);

  useEffect(() => {
    ensureList({ shareCode: activeRoom }).catch(() => {});
  }, [activeRoom, ensureList]);

  const author = authorName.trim() || "Anónimo";

  const handleJoin = async () => {
    const code = (roomInput || "sala-demo").trim() || "sala-demo";
    setActiveRoom(code);
    setActivePassword(passwordInput.trim());
    await ensureList({
      shareCode: code,
      password: passwordInput.trim() || undefined,
    }).catch(() => {});
  };

  const handleUpload = async (uri: string, mime: string) => {
    const postUrl = await generateUploadUrl();

    if (Platform.OS === "web") {
      const blob = await (await fetch(uri)).blob();
      const res = await fetch(postUrl, {
        method: "POST",
        headers: {
          "Content-Type": blob.type || mime || "application/octet-stream",
        },
        body: blob,
      });
      const { storageId } = await res.json();
      return storageId as string;
    }

    const res = await expoFetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": mime || "application/octet-stream" },
      body: new File(uri),
    });
    const { storageId } = await res.json();
    return storageId as string;
  };

  const handleAdd = async (payload: NewTaskPayload) => {
    const listId = response?.status === "ok" ? response.list._id : undefined;
    if (!listId) {
      notify("Sala cerrada", "Vuelve a entrar en la sala para anotar.");
      return;
    }
    await addTodo({
      listId,
      title: payload.title,
      createdBy: author,
      date: selectedDate,
      imageId: payload.imageId as any,
      audioId: payload.audioId as any,
      audioDurationMs: payload.audioDurationMs,
    });
  };

  const handleShare = async () => {
    const message = `Apúntate a mi diario en TDAH Tasks con el código: ${activeRoom}`;
    if (Platform.OS === "web") {
      await navigator.clipboard?.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    try {
      await Share.share({ message });
    } catch {
      /* el usuario canceló */
    }
  };

  const openHistory = () =>
    router.push({
      pathname: "/history",
      params: { room: activeRoom, password: activePassword },
    });

  const pendingCount =
    response?.status === "ok" ? response.items.filter((i) => !i.done).length : 0;

  const handleDeleteItem = (id: string) => {
    confirmAction({
      title: "Eliminar nota",
      message: "¿Seguro que quieres borrarla?",
      confirmLabel: "Eliminar",
      onConfirm: () => deleteTodo({ id: id as any }),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <RoomHeader
          room={roomInput}
          setRoom={setRoomInput}
          pass={passwordInput}
          setPass={setPasswordInput}
          onJoin={handleJoin}
          onShare={handleShare}
          onHistory={openHistory}
          author={authorName}
          setAuthor={setAuthorName}
          copied={copied}
        />

        <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />

        {response === undefined ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : response.status === "unauthorized" ? (
          <View style={styles.center}>
            <Text style={styles.statusTitle}>Clave incorrecta</Text>
            <Text style={styles.statusText}>
              Pulsa ⚙ y revisa la contraseña de la sala.
            </Text>
          </View>
        ) : response.status === "not_found" ? (
          <View style={styles.center}>
            <Text style={styles.statusTitle}>Sala sin empezar</Text>
            <Text style={styles.statusText}>
              Pulsa ⚙ y “Entrar” para crear la sala.
            </Text>
          </View>
        ) : (
          <FlatList
            style={styles.flex}
            data={response.items as TaskItem[]}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
            contentInsetAdjustmentBehavior="never"
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🗒️</Text>
                <Text style={styles.emptyText}>
                  Nada anotado todavía. Escribe, graba o añade una foto.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TaskCard
                item={item}
                onToggle={(id) => toggleTodo({ id: id as any })}
                onDelete={handleDeleteItem}
                onOpenImage={setViewerUri}
              />
            )}
          />
        )}

        <View
          style={[
            styles.composer,
            Platform.OS === "android" && keyboardHeight > 0
              ? { paddingBottom: keyboardHeight }
              : null,
          ]}
        >
          <TaskInput
            onAdd={handleAdd}
            upload={handleUpload}
            dateLabel={readableDate(selectedDate)}
          />
          <Text style={styles.pending}>{pendingCount} pendientes</Text>
        </View>

        <ImageViewer
          uri={viewerUri}
          visible={!!viewerUri}
          onClose={() => setViewerUri(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.colors.bg },
    flex: { flex: 1 },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: t.spacing.xl,
    },
    statusTitle: {
      color: t.colors.text,
      fontSize: t.font.heading,
      fontWeight: "700",
      marginBottom: t.spacing.sm,
    },
    statusText: {
      color: t.colors.textSecondary,
      fontSize: t.font.body,
      textAlign: "center",
    },
    list: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.md,
      paddingBottom: t.spacing.sm,
      flexGrow: 1,
    },
    empty: { alignItems: "center", paddingTop: t.spacing.xl, gap: t.spacing.sm },
    emptyEmoji: { fontSize: 34 },
    emptyText: {
      color: t.colors.textSecondary,
      fontSize: t.font.body,
      textAlign: "center",
      paddingHorizontal: t.spacing.lg,
    },
    composer: { paddingBottom: t.spacing.xs },
    pending: {
      textAlign: "center",
      color: t.colors.textTertiary,
      fontSize: t.font.tiny,
      paddingBottom: t.spacing.sm,
    },
  });
