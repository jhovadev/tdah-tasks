import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

// 1. Generador de URL para subir archivos directamente a Convex Storage
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

type MediaDoc = Doc<"todos">;

// Resuelve las URLs públicas de imagen y audio de una nota, contemplando
// tanto el modelo nuevo (imageId/audioId) como el heredado (mediaType/storageId).
async function withMediaUrls(ctx: any, item: MediaDoc) {
  let imageId = item.imageId ?? null;
  let audioId = item.audioId ?? null;

  if (!imageId && !audioId && item.mediaType && item.storageId) {
    if (item.mediaType === "image") imageId = item.storageId;
    else audioId = item.storageId;
  }

  const [imageUrl, audioUrl] = await Promise.all([
    imageId ? ctx.storage.getUrl(imageId) : Promise.resolve(null),
    audioId ? ctx.storage.getUrl(audioId) : Promise.resolve(null),
  ]);

  return {
    ...item,
    imageUrl,
    audioUrl,
    audioDurationMs: item.audioDurationMs ?? null,
  };
}

// 2. Notas de una sala para una fecha concreta.
export const getListByCodeAndDate = query({
  args: {
    shareCode: v.string(),
    date: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("lists")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", args.shareCode))
      .unique();

    if (!list) return { status: "not_found" as const };

    if (list.password && list.password !== args.password) {
      return { status: "unauthorized" as const };
    }

    const rawItems = await ctx.db
      .query("todos")
      .withIndex("by_list_and_date", (q) =>
        q.eq("listId", list._id).eq("date", args.date)
      )
      .order("desc")
      .collect();

    const items = await Promise.all(
      rawItems.map((item) => withMediaUrls(ctx, item))
    );

    return { status: "ok" as const, list, items };
  },
});

// 2b. Todo el historial de una sala, agrupado por día.
export const getHistoryByRoom = query({
  args: {
    shareCode: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("lists")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", args.shareCode))
      .unique();

    if (!list) return { status: "not_found" as const };

    if (list.password && list.password !== args.password) {
      return { status: "unauthorized" as const };
    }

    const rawItems = await ctx.db
      .query("todos")
      .withIndex("by_listId", (q) => q.eq("listId", list._id))
      .collect();

    const items = await Promise.all(
      rawItems.map(async (item) => ({
        ...(await withMediaUrls(ctx, item)),
        date: item.date ?? "sin-fecha",
      }))
    );

    const history: Record<string, typeof items> = {};
    for (const item of items) {
      const key = item.date ?? "sin-fecha";
      (history[key] ??= []).push(item);
    }

    return { status: "ok" as const, list, history };
  },
});

export const createList = mutation({
  args: {
    title: v.string(),
    shareCode: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("lists", {
      title: args.title,
      shareCode: args.shareCode,
      password: args.password?.trim() || undefined,
      isPublic: !args.password,
    });
  },
});

export const addTodo = mutation({
  args: {
    listId: v.id("lists"),
    title: v.string(),
    createdBy: v.string(),
    date: v.string(),
    imageId: v.optional(v.id("_storage")),
    audioId: v.optional(v.id("_storage")),
    audioDurationMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("todos", {
      listId: args.listId,
      title: args.title,
      done: false,
      createdBy: args.createdBy,
      date: args.date,
      imageId: args.imageId,
      audioId: args.audioId,
      audioDurationMs: args.audioDurationMs,
    });
  },
});

export const toggleTodo = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id);
    if (!todo) return;
    await ctx.db.patch(args.id, { done: !todo.done });
  },
});

export const deleteTodo = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) return;
    // Borra cualquier archivo asociado (modelo nuevo y heredado).
    const ids = [existing.imageId, existing.audioId, existing.storageId].filter(
      Boolean
    ) as Id<"_storage">[];
    await Promise.all(ids.map((id) => ctx.storage.delete(id)));
    await ctx.db.delete(args.id);
  },
});

// Crea la sala si no existe (útil para el primer "Entrar").
export const ensureList = mutation({
  args: {
    shareCode: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("lists")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", args.shareCode))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("lists", {
      title: args.shareCode,
      shareCode: args.shareCode,
      password: args.password?.trim() || undefined,
      isPublic: !args.password,
    });
  },
});

// Borra todas las notas de un día concreto (botón "vaciar día" del historial).
export const deleteGroup = mutation({
  args: {
    shareCode: v.string(),
    password: v.optional(v.string()),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("lists")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", args.shareCode))
      .unique();

    if (!list) return { deleted: 0 };
    if (list.password && list.password !== args.password) {
      throw new Error("No autorizado");
    }

    const items = await ctx.db
      .query("todos")
      .withIndex("by_list_and_date", (q) =>
        q.eq("listId", list._id).eq("date", args.date)
      )
      .collect();

    for (const item of items) {
      const ids = [item.imageId, item.audioId, item.storageId].filter(
        Boolean
      ) as Id<"_storage">[];
      await Promise.all(ids.map((id) => ctx.storage.delete(id)));
      await ctx.db.delete(item._id);
    }

    return { deleted: items.length };
  },
});
