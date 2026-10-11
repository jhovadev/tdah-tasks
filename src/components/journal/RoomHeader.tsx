import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme, useThemedStyles, type Theme } from "../../theme";

interface Props {
  room: string;
  setRoom: (v: string) => void;
  pass: string;
  setPass: (v: string) => void;
  onJoin: () => void;
  onShare: () => void;
  onHistory: () => void;
  author: string;
  setAuthor: (v: string) => void;
  copied: boolean;
}

export function RoomHeader({
  room,
  setRoom,
  pass,
  setPass,
  onJoin,
  onShare,
  onHistory,
  author,
  setAuthor,
  copied,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const { colors, isDark, toggleScheme } = useTheme();
  const [editing, setEditing] = useState(false);

  const handleJoin = () => {
    onJoin();
    setEditing(false);
  };

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <Text style={styles.appName}>TDAH Tasks</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            #{room} · {author || "Anónimo"}
          </Text>
        </View>

        <View style={styles.btnRow}>
          <Pressable
            style={styles.iconBtn}
            onPress={toggleScheme}
            hitSlop={6}
            accessibilityLabel="Cambiar tema"
          >
            <Text style={styles.iconText}>{isDark ? "☀︎" : "☾"}</Text>
          </Pressable>
          <Pressable
            style={[styles.iconBtn, editing && styles.iconBtnActive]}
            onPress={() => setEditing((v) => !v)}
            hitSlop={6}
            accessibilityLabel="Editar sala"
          >
            <Text style={styles.iconText}>{editing ? "✕" : "⚙︎"}</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={onHistory} hitSlop={6}>
            <Text style={styles.iconText}>🕘</Text>
          </Pressable>
          <Pressable style={styles.shareBtn} onPress={onShare} hitSlop={6}>
            <Text style={styles.shareText}>{copied ? "Copiado ✓" : "Compartir"}</Text>
          </Pressable>
        </View>
      </View>

      {editing && (
        <View style={styles.editor}>
          <View style={styles.fieldRow}>
            <TextInput
              style={styles.input}
              value={room}
              onChangeText={setRoom}
              placeholder="#sala"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              value={pass}
              onChangeText={setPass}
              placeholder="Clave (opcional)"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
            />
          </View>
          <View style={styles.fieldRow}>
            <TextInput
              style={styles.input}
              value={author}
              onChangeText={setAuthor}
              placeholder="Tu nombre"
              placeholderTextColor={colors.textSecondary}
            />
            <Pressable style={styles.joinBtn} onPress={handleJoin}>
              <Text style={styles.joinText}>Entrar</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    header: {
      backgroundColor: t.colors.bg,
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.sm,
      paddingBottom: t.spacing.md,
      gap: t.spacing.md,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    brand: { flex: 1, marginRight: t.spacing.sm },
    appName: {
      color: t.colors.text,
      fontSize: t.font.title,
      fontWeight: "800",
    },
    subtitle: { color: t.colors.textSecondary, fontSize: t.font.small, marginTop: 2 },
    btnRow: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    iconBtnActive: { backgroundColor: t.colors.surfacePressed },
    iconText: { fontSize: 15, color: t.colors.text },
    shareBtn: {
      backgroundColor: t.colors.accentSoft,
      borderRadius: t.radius.pill,
      paddingHorizontal: t.spacing.md,
      height: 34,
      justifyContent: "center",
    },
    shareText: { color: t.colors.accent, fontSize: t.font.small, fontWeight: "700" },
    editor: { gap: t.spacing.sm },
    fieldRow: { flexDirection: "row", gap: t.spacing.sm },
    input: {
      flex: 1,
      height: 38,
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.md,
      paddingHorizontal: t.spacing.md,
      fontSize: t.font.body,
      color: t.colors.text,
    },
    joinBtn: {
      backgroundColor: t.colors.accent,
      borderRadius: t.radius.md,
      paddingHorizontal: t.spacing.lg,
      justifyContent: "center",
    },
    joinText: { color: t.colors.onAccent, fontWeight: "700", fontSize: t.font.small },
  });
