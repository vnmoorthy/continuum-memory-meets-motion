import { z } from "zod";

export const NodeKindSchema = z.enum([
  "person",
  "project",
  "decision",
  "artifact",
  "loop",
  "event",
  "goal",
]);

export const LoopStatusSchema = z.enum(["open", "running", "blocked", "closed"]);
export const RunStatusSchema = z.enum([
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled",
]);
export const EdgeKindSchema = z.enum([
  "owns",
  "involves",
  "blocks",
  "depends_on",
  "mentions",
  "produced",
  "closes",
  "related",
]);

/** Tags must be a JSON array of strings — never a bare string or object. */
export const TagsSchema = z.array(z.string().max(64)).max(32);

export const MetadataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

export const MemoryNodeSchema = z.object({
  id: z.string().min(1).max(128),
  kind: NodeKindSchema,
  title: z.string().min(1).max(500),
  summary: z.string().max(5000).default(""),
  tags: TagsSchema.default([]),
  status: LoopStatusSchema.optional(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  metadata: MetadataSchema.default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const OpenLoopSchema = MemoryNodeSchema.extend({
  kind: z.literal("loop"),
  status: LoopStatusSchema,
  priority: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  dueAt: z.string().optional(),
  contextNodeIds: z.array(z.string()).default([]),
  suggestedActions: z.array(z.string()).default([]),
  riskEntityId: z.string().optional(),
});

export const MemoryEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  kind: EdgeKindSchema,
  weight: z.number(),
  label: z.string().optional(),
  createdAt: z.string(),
});

export const CreateMemoryBodySchema = z.object({
  action: z.literal("reset").optional(),
  id: z.string().min(1).max(128).optional(),
  kind: NodeKindSchema.optional(),
  title: z.string().min(1).max(500).optional(),
  summary: z.string().max(5000).optional(),
  tags: TagsSchema.optional(),
  metadata: MetadataSchema.optional(),
  status: LoopStatusSchema.optional(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  contextNodeIds: z.array(z.string()).optional(),
  suggestedActions: z.array(z.string()).optional(),
  riskEntityId: z.string().optional(),
});

export const CreateRunBodySchema = z.object({
  loopId: z.string().min(1),
  trigger: z.enum(["manual", "morning", "watchdog"]).optional().default("manual"),
});

export const IngestBodySchema = z.object({
  text: z.string().min(1).max(20_000),
  source: z.string().max(64).optional(),
});

export const MorningBodySchema = z.object({
  limit: z.number().int().min(1).max(3).optional().default(2),
});

export const WatchdogPatchBodySchema = z.object({
  id: z.string().optional(),
  enabled: z.boolean().optional(),
  patch: z
    .object({
      enabled: z.boolean().optional(),
    })
    .optional(),
  watchdogs: z.array(z.any()).optional(),
});

export const WatchdogScanBodySchema = z.object({
  autoQueue: z.boolean().optional().default(true),
  limit: z.number().int().min(1).max(3).optional().default(2),
});

export const RiskEntitySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  dollars: z.number().nonnegative(),
  sourceNodeId: z.string().optional(),
});

export function zodErrorResponse(err: z.ZodError) {
  return {
    error: "validation_failed",
    issues: err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
      code: i.code,
    })),
  };
}
