import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemedStyles, type Theme } from "../../theme";

interface Props {
  uri: string | null;
  visible: boolean;
  onClose: () => void;
}

/** Popup a pantalla completa para ver una imagen en grande. */
export function ImageViewer({ uri, visible, onClose }: Props) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={12}
            accessibilityLabel="Cerrar imagen"
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        {uri ? (
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="contain"
            transition={150}
          />
        ) : null}

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.hint}>Toca para cerrar</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: t.colors.overlay, justifyContent: "center" },
    topBar: { position: "absolute", top: 0, right: 0, zIndex: 2 },
    closeBtn: {
      marginRight: t.spacing.lg,
      width: 34,
      height: 34,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.surfaceAlt,
      justifyContent: "center",
      alignItems: "center",
    },
    closeText: {
      color: t.colors.text,
      fontSize: t.font.heading,
      fontWeight: "600",
    },
    image: { width: "100%", height: "78%" },
    footer: { position: "absolute", bottom: 0, left: 0, right: 0 },
    hint: {
      textAlign: "center",
      color: t.colors.textSecondary,
      fontSize: t.font.small,
    },
  });
