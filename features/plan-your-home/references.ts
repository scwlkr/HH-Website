import { z } from "zod";

export const PLAN_HOME_REFERENCE_LIMITS = {
  total: 10,
  files: 6,
  links: 6,
  bytesPerFile: 10 * 1024 * 1024,
  totalFileBytes: 40 * 1024 * 1024,
} as const;

export const planHomeFileExtensions = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
] as const;

export const planHomeFileMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

const referenceNoteSchema = z.string().trim().max(500).optional();
const referenceTimestampSchema = z.string().datetime({ offset: true });

export const planHomeFileReferenceSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    kind: z.literal("file"),
    originalName: z.string().trim().min(1).max(255),
    objectPath: z
      .string()
      .trim()
      .regex(/^inquiryReferences\/[^/]+\/[^/]+$/),
    extension: z.enum(planHomeFileExtensions),
    mimeType: z.enum(planHomeFileMimeTypes),
    sizeBytes: z.number().int().positive().max(PLAN_HOME_REFERENCE_LIMITS.bytesPerFile),
    note: referenceNoteSchema,
    createdAt: referenceTimestampSchema,
  })
  .strict()
  .superRefine((reference, context) => {
    const mimeTypesByExtension: Record<
      (typeof planHomeFileExtensions)[number],
      readonly (typeof planHomeFileMimeTypes)[number][]
    > = {
      pdf: ["application/pdf"],
      jpg: ["image/jpeg"],
      jpeg: ["image/jpeg"],
      png: ["image/png"],
      webp: ["image/webp"],
      heic: ["image/heic", "image/heif"],
    };

    if (!mimeTypesByExtension[reference.extension].includes(reference.mimeType)) {
      context.addIssue({
        code: "custom",
        path: ["mimeType"],
        message: "File extension and MIME type must describe the same approved format.",
      });
    }

    if (!reference.originalName.toLowerCase().endsWith(`.${reference.extension}`)) {
      context.addIssue({
        code: "custom",
        path: ["originalName"],
        message: "Original file name must match the declared extension.",
      });
    }
  });

export const planHomeLinkReferenceSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    kind: z.literal("link"),
    url: z
      .url()
      .max(2_048)
      .refine((value) => {
        const protocol = new URL(value).protocol;
        return protocol === "http:" || protocol === "https:";
      }, "Reference links must use http or https.")
      .transform((value) => new URL(value).toString()),
    hostname: z.string().trim().min(1).max(253),
    note: referenceNoteSchema,
    createdAt: referenceTimestampSchema,
  })
  .strict()
  .superRefine((reference, context) => {
    if (new URL(reference.url).hostname !== reference.hostname) {
      context.addIssue({
        code: "custom",
        path: ["hostname"],
        message: "Reference hostname must match the normalized URL.",
      });
    }
  });

export const planHomeReferenceMetadataSchema = z.discriminatedUnion("kind", [
  planHomeFileReferenceSchema,
  planHomeLinkReferenceSchema,
]);

export const planHomeReferenceCollectionSchema = z
  .array(planHomeReferenceMetadataSchema)
  .max(PLAN_HOME_REFERENCE_LIMITS.total)
  .superRefine((references, context) => {
    const ids = references.map((reference) => reference.id);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        message: "Reference IDs must be unique.",
      });
    }

    const files = references.filter((reference) => reference.kind === "file");
    if (files.length > PLAN_HOME_REFERENCE_LIMITS.files) {
      context.addIssue({
        code: "custom",
        message: `No more than ${PLAN_HOME_REFERENCE_LIMITS.files} files are allowed.`,
      });
    }

    const links = references.filter((reference) => reference.kind === "link");
    if (links.length > PLAN_HOME_REFERENCE_LIMITS.links) {
      context.addIssue({
        code: "custom",
        message: `No more than ${PLAN_HOME_REFERENCE_LIMITS.links} links are allowed.`,
      });
    }

    const totalFileBytes = files.reduce(
      (total, reference) => total + reference.sizeBytes,
      0,
    );
    if (totalFileBytes > PLAN_HOME_REFERENCE_LIMITS.totalFileBytes) {
      context.addIssue({
        code: "custom",
        message: "Reference files may total no more than 40 MB.",
      });
    }
  });

export type PlanHomeFileReference = z.infer<typeof planHomeFileReferenceSchema>;
export type PlanHomeLinkReference = z.infer<typeof planHomeLinkReferenceSchema>;
export type PlanHomeReferenceMetadata = z.infer<
  typeof planHomeReferenceMetadataSchema
>;
