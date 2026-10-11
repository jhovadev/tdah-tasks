import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

const enabled = Platform.OS === "ios" || Platform.OS === "android";

function safe(run: () => Promise<void>) {
  if (!enabled) return;
  run().catch(() => {});
}

export const haptics = {
  /** Toque ligero (seleccionar, pulsar un botón). */
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Cambio de selección (marcar/desmarcar, elegir fecha). */
  select: () => safe(() => Haptics.selectionAsync()),
  /** Acción completada con éxito (nota guardada). */
  success: () =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Aviso (borrar, acción sensible). */
  warn: () =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  /** Error. */
  error: () =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
