import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import { haptics } from "../../lib/haptics";
import { useTheme, useThemedStyles, type Theme } from "../../theme";
import type { TaskAttachment, PendingAudio } from "../../lib/types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING = { damping: 14, stiffness: 320 };

const AUDIO_MIME: Record<string, string> = {
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  webm: "audio/webm",
  caf: "audio/x-caf",
  "3gp": "audio/3gpp",
  ogg: "audio/ogg",
  wav: "audio/wav",
};

function audioMimeFromUri(uri: string): string {
  const ext = uri.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  return AUDIO_MIME[ext] ?? "audio/mp4";
}

export interface NewTaskPayload {
  title: string;
  imageId?: string;
  audioId?: string;
  audioDurationMs?: number;
}

interface Props {
  onAdd: (payload: NewTaskPayload) => Promise<void>;
  upload: (uri: string, mime: string) => Promise<string>;
  dateLabel: string;
}

export function TaskInput({ onAdd, upload, dateLabel }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [text, setText] = useState("");
  const [image, setImage] = useState<TaskAttachment | null>(null);
  const [audio, setAudio] = useState<PendingAudio | null>(null);
  const [isSending, setIsSending] = useState(false);

  const sendScale = useSharedValue(1);
  const sendAnim = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const canSend =
    !isSending &&
    !recorderState.isRecording &&
    (text.trim().length > 0 || !!image || !!audio);

  const pickImage = async (fromCamera: boolean) => {
    try {
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permiso denegado", "Se requiere acceso a la cámara.");
          return;
        }
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            quality: 0.8,
            allowsEditing: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
            allowsEditing: true,
          });

      if (!result.canceled && result.assets[0]) {
        setImage({
          uri: result.assets[0].uri,
          mime: result.assets[0].mimeType ?? "image/jpeg",
        });
        haptics.select();
      }
    } catch {
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
    }
  };

  const handleImagePress = () => {
    Alert.alert("Añadir imagen", "¿De dónde quieres tomarla?", [
      { text: "Cámara", onPress: () => pickImage(true) },
      { text: "Galería", onPress: () => pickImage(false) },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const toggleRecording = async () => {
    if (recorderState.isRecording) {
      const durationMs = recorderState.durationMillis;
      try {
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        if (uri) {
          setAudio({ uri, mime: audioMimeFromUri(uri), durationMs });
          haptics.select();
        }
      } catch {
        Alert.alert("Error", "No se pudo guardar el audio.");
      }
      return;
    }

    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert("Permiso denegado", "Se requiere acceso al micrófono.");
        return;
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      haptics.tap();
    } catch {
      Alert.alert("Error", "No se pudo iniciar la grabación.");
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    setIsSending(true);
    try {
      const imageId = image ? await upload(image.uri, image.mime) : undefined;
      const audioId = audio ? await upload(audio.uri, audio.mime) : undefined;

      await onAdd({
        title: text.trim() || (image ? "Foto" : audio ? "Nota de voz" : ""),
        imageId,
        audioId,
        audioDurationMs: audio?.durationMs,
      });

      setText("");
      setImage(null);
      setAudio(null);
      haptics.success();
    } catch {
      haptics.error();
      Alert.alert("Error", "No se pudo guardar la nota. Inténtalo de nuevo.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <TextInput
          style={styles.textInput}
          placeholder={`Anotar el ${dateLabel}...`}
          placeholderTextColor={colors.textSecondary}
          value={text}
          onChangeText={setText}
          multiline
        />

        {(image || audio) && (
          <Animated.View
            entering={FadeInDown.duration(160)}
            style={styles.attachments}
          >
            {image && (
              <View style={styles.imagePreview}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.imageThumb}
                  contentFit="cover"
                />
                <Pressable
                  style={styles.removeBadge}
                  onPress={() => setImage(null)}
                  hitSlop={6}
                >
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              </View>
            )}

            {audio && (
              <View style={styles.audioChip}>
                <Text style={styles.audioChipIcon}>🎙</Text>
                <Text style={styles.audioChipText}>
                  {Math.round(audio.durationMs / 1000)}s
                </Text>
                <Pressable onPress={() => setAudio(null)} hitSlop={6}>
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        )}

        <View style={styles.actions}>
          {recorderState.isRecording && (
            <Animated.View entering={FadeIn} style={styles.recordingPill}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTime}>
                {Math.round(recorderState.durationMillis / 1000)}s
              </Text>
            </Animated.View>
          )}

          <Pressable
            style={styles.iconBtn}
            onPress={handleImagePress}
            disabled={isSending}
          >
            <Text style={styles.iconText}>📷</Text>
          </Pressable>

          <Pressable
            style={[
              styles.iconBtn,
              recorderState.isRecording && styles.recordingBtn,
            ]}
            onPress={toggleRecording}
            disabled={isSending}
          >
            <Text style={styles.iconText}>
              {recorderState.isRecording ? "⏹" : "🎙"}
            </Text>
          </Pressable>

          <AnimatedPressable
            style={[
              styles.sendBtn,
              !canSend && styles.sendBtnDisabled,
              sendAnim,
            ]}
            onPress={handleSend}
            onPressIn={() => {
              sendScale.set(withSpring(0.88, SPRING));
            }}
            onPressOut={() => {
              sendScale.set(withSpring(1, SPRING));
            }}
            disabled={!canSend}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.onAccent} />
            ) : (
              <Text style={styles.sendIcon}>↑</Text>
            )}
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { paddingHorizontal: t.spacing.lg, marginBottom: t.spacing.sm },
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: t.radius.lg,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.md,
      borderWidth: 0.5,
      borderColor: t.colors.border,
    },
    textInput: {
      fontSize: t.font.body,
      color: t.colors.text,
      minHeight: 40,
      maxHeight: 140,
      paddingTop: 0,
    },
    attachments: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing.sm,
      marginTop: t.spacing.sm,
    },
    imagePreview: { position: "relative" },
    imageThumb: {
      width: 72,
      height: 72,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.surfaceAlt,
    },
    removeBadge: {
      position: "absolute",
      top: -6,
      right: -6,
      width: 20,
      height: 20,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.danger,
      justifyContent: "center",
      alignItems: "center",
    },
    removeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
    audioChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: t.spacing.sm,
      backgroundColor: t.colors.surfaceAlt,
      borderRadius: t.radius.pill,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
    },
    audioChipIcon: { fontSize: 14 },
    audioChipText: {
      color: t.colors.text,
      fontSize: t.font.small,
      fontWeight: "600",
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: t.spacing.sm,
      marginTop: t.spacing.md,
    },
    recordingPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginRight: "auto",
      backgroundColor: t.colors.dangerSoft,
      borderRadius: t.radius.pill,
      paddingHorizontal: t.spacing.md,
      paddingVertical: 4,
    },
    recordingDot: {
      width: 8,
      height: 8,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.danger,
    },
    recordingTime: {
      color: t.colors.danger,
      fontSize: t.font.small,
      fontWeight: "700",
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surfaceAlt,
      justifyContent: "center",
      alignItems: "center",
    },
    recordingBtn: { backgroundColor: t.colors.danger },
    iconText: { fontSize: 16 },
    sendBtn: {
      width: 36,
      height: 36,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.accent,
      justifyContent: "center",
      alignItems: "center",
    },
    sendBtnDisabled: { opacity: 0.3 },
    sendIcon: { color: t.colors.onAccent, fontSize: 20, fontWeight: "800" },
  });
