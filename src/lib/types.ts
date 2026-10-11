// Tipos compartidos entre la UI y las respuestas de Convex.

export type MediaKind = "image" | "audio";

export interface TaskItem {
  _id: string;
  title: string;
  done: boolean;
  createdBy: string;
  date?: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  audioDurationMs?: number | null;
  /** Compatibilidad con items antiguos de un solo adjunto. */
  mediaType?: MediaKind;
  mediaUrl?: string | null;
}

export interface TaskAttachment {
  uri: string;
  mime: string;
}

export interface PendingAudio extends TaskAttachment {
  durationMs: number;
}
