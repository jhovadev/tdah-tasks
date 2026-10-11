import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useThemedStyles, type Theme } from "../../theme";

interface Props {
  url: string;
  /** Duración conocida (ms) para mostrar antes de reproducir. */
  durationMs?: number | null;
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** Reproductor compacto de notas de voz, estilo burbuja iOS. */
export function AudioPlayer({ url, durationMs }: Props) {
  const styles = useThemedStyles(makeStyles);
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);

  const duration =
    status.duration && status.duration > 0
      ? status.duration
      : (durationMs ?? 0) / 1000;
  const progress =
    duration > 0 ? Math.min(1, (status.currentTime || 0) / duration) : 0;

  const togglePlay = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish) {
      player.seekTo(0);
    }
    player.play();
  };

  return (
    <Pressable style={styles.bubble} onPress={togglePlay}>
      <View style={styles.playBtn}>
        <Text style={styles.playIcon}>{status.playing ? "❚❚" : "▶"}</Text>
      </View>

      <View style={styles.trackArea}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.time}>
          {formatTime(
            status.playing || status.currentTime ? status.currentTime : duration
          )}
        </Text>
      </View>
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    bubble: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.colors.surfaceAlt,
      borderRadius: t.radius.pill,
      paddingVertical: 6,
      paddingLeft: 6,
      paddingRight: t.spacing.md,
      marginTop: t.spacing.sm,
      gap: t.spacing.sm,
    },
    playBtn: {
      width: 30,
      height: 30,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.accent,
      justifyContent: "center",
      alignItems: "center",
    },
    playIcon: { color: t.colors.onAccent, fontSize: 12, fontWeight: "700" },
    trackArea: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing.sm,
    },
    track: {
      flex: 1,
      height: 3,
      borderRadius: 2,
      backgroundColor: t.colors.track,
      overflow: "hidden",
    },
    fill: { height: 3, backgroundColor: t.colors.accent },
    time: {
      color: t.colors.textSecondary,
      fontSize: t.font.tiny,
      minWidth: 30,
      textAlign: "right",
    },
  });
