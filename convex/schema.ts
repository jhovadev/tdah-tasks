import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  lists: defineTable({
    title: v.string(),
    shareCode: v.string(),
    password: v.optional(v.string()),
    isPublic: v.boolean(),
    ownerSecret: v.optional(v.string()),
  }).index("by_shareCode", ["shareCode"]),

  todos: defineTable({
    listId: v.id("lists"),
    title: v.string(),
    done: v.boolean(),
    createdBy: v.string(),
    date: v.optional(v.string()),
    // Una nota puede llevar texto + imagen + audio a la vez.
    imageId: v.optional(v.id("_storage")),
    audioId: v.optional(v.id("_storage")),
    audioDurationMs: v.optional(v.number()),
    // Campos heredados de la versión anterior (adjunto único).
    mediaType: v.optional(v.union(v.literal("image"), v.literal("audio"))),
    storageId: v.optional(v.id("_storage")),
  })
    .index("by_listId", ["listId"])
    .index("by_list_and_date", ["listId", "date"]),
});
