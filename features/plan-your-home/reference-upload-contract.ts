import { z } from "zod";

import {
  PLAN_HOME_REFERENCE_LIMITS,
  planHomeFileExtensions,
  planHomeFileMimeTypes,
  planHomeReferenceCollectionSchema,
  type PlanHomeReferenceMetadata,
} from "./references.ts";

const draftIdSchema = z.string().regex(/^draft-[a-f0-9]{40}$/);
const referenceIdSchema = z
  .string()
  .regex(/^(?:file|link)-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
const expectedRevisionSchema = z.number().int().positive();
const noteSchema = z.string().trim().max(500).default("");

export const PLAN_HOME_CUSTOMER_REFERENCE_VALIDATION_MESSAGE =
  "That reference could not be accepted. Check it and try again.";

export const planHomeUploadRequestSchema = z
  .object({
    draftId: draftIdSchema,
    expectedRevision: expectedRevisionSchema,
    originalName: z.string().trim().min(1).max(255),
    mimeType: z.enum(planHomeFileMimeTypes),
    sizeBytes: z
      .number()
      .int()
      .positive()
      .max(PLAN_HOME_REFERENCE_LIMITS.bytesPerFile),
  })
  .strict()
  .transform((value, context) => {
    const extension = value.originalName.split(".").at(-1)?.toLowerCase();
    if (
      !extension ||
      !planHomeFileExtensions.includes(
        extension as (typeof planHomeFileExtensions)[number],
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["originalName"],
        message: "Choose a PDF, JPEG, PNG, WebP, or HEIC file.",
      });
      return z.NEVER;
    }

    const allowedMimeTypes: Record<
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
    const canonicalExtension = extension as (typeof planHomeFileExtensions)[number];
    if (!allowedMimeTypes[canonicalExtension].includes(value.mimeType)) {
      context.addIssue({
        code: "custom",
        path: ["mimeType"],
        message: "The file extension and type do not match.",
      });
      return z.NEVER;
    }

    return { ...value, extension: canonicalExtension };
  });

export const planHomeFinalizeUploadSchema = z
  .object({
    draftId: draftIdSchema,
    expectedRevision: expectedRevisionSchema,
    referenceId: referenceIdSchema,
    note: noteSchema,
  })
  .strict();

export const planHomeAbandonUploadSchema = z
  .object({
    draftId: draftIdSchema,
    referenceId: referenceIdSchema,
  })
  .strict();

export const planHomeAddLinkSchema = z
  .object({
    draftId: draftIdSchema,
    expectedRevision: expectedRevisionSchema,
    url: z.string().trim().min(1).max(2_048),
    note: noteSchema,
  })
  .strict();

export const planHomeRemoveReferenceSchema = z
  .object({
    draftId: draftIdSchema,
    expectedRevision: expectedRevisionSchema,
    referenceId: referenceIdSchema,
  })
  .strict();

export const planHomeSyncReferenceNotesSchema = z
  .object({
    draftId: draftIdSchema,
    expectedRevision: expectedRevisionSchema,
    notes: z
      .array(
        z
          .object({
            referenceId: referenceIdSchema,
            note: noteSchema,
          })
          .strict(),
      )
      .max(PLAN_HOME_REFERENCE_LIMITS.total)
      .refine(
        (notes) => new Set(notes.map(({ referenceId }) => referenceId)).size === notes.length,
        "Reference notes must be unique.",
      ),
  })
  .strict();

export const planHomeReferenceMutationResultSchema = z.object({
  draftId: draftIdSchema,
  revision: expectedRevisionSchema,
  references: planHomeReferenceCollectionSchema,
  applied: z.boolean(),
});

export type PlanHomeUploadRequest = z.infer<typeof planHomeUploadRequestSchema>;
export type PlanHomeFinalizeUploadInput = z.infer<typeof planHomeFinalizeUploadSchema>;
export type PlanHomeAddLinkInput = z.infer<typeof planHomeAddLinkSchema>;
export type PlanHomeRemoveReferenceInput = z.infer<typeof planHomeRemoveReferenceSchema>;
export type PlanHomeSyncReferenceNotesInput = z.infer<typeof planHomeSyncReferenceNotesSchema>;

export type PlanHomeUploadCapability = Readonly<{
  draftId: string;
  referenceId: string;
  objectPath: string;
  uploadUrl: string;
  method: "PUT" | "POST";
  headers: Readonly<Record<string, string>>;
  emulatorMultipartBoundary?: string;
  expiresAt: string;
}>;

export type PlanHomeReferenceMutationResult = Readonly<{
  draftId: string;
  revision: number;
  references: readonly PlanHomeReferenceMetadata[];
  applied: boolean;
}>;

export class PlanHomeReferenceValidationError extends Error {
  readonly code = "validation";

  constructor(message: string) {
    super(message);
    this.name = "PlanHomeReferenceValidationError";
  }
}

export function normalizePlanHomeReferenceLink(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new PlanHomeReferenceValidationError(
      "Enter a complete http or https link.",
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new PlanHomeReferenceValidationError(
      "Reference links must use http or https.",
    );
  }
  if (!parsed.hostname) {
    throw new PlanHomeReferenceValidationError(
      "Reference links require a hostname.",
    );
  }

  return { url: parsed.toString(), hostname: parsed.hostname } as const;
}

export function hasMatchingPlanHomeFileSignature(
  extension: (typeof planHomeFileExtensions)[number],
  bytes: Uint8Array,
) {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));
  if (extension === "pdf") return ascii(0, 5) === "%PDF-";
  if (extension === "jpg" || extension === "jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (extension === "png") {
    return (
      bytes[0] === 0x89 &&
      ascii(1, 4) === "PNG" &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (extension === "webp") {
    return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
  }

  const heicBrands = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"]);
  return ascii(4, 8) === "ftyp" && heicBrands.has(ascii(8, 12));
}
