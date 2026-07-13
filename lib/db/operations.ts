import "server-only";

import { unstable_cache } from "next/cache";
import {
  getFirebaseDatabase,
  getFirebaseStorageBucket,
  isFirebaseAdminConfigured,
} from "@/lib/db/client";
import type {
  ExistingProjectImageFormInput,
  PricingSettings,
  PricingWriteInput,
  ProjectDetail,
  ProjectImage,
  ProjectSummary,
  ProjectWriteInput,
} from "@/types/operations";

export const projectCacheTag = "projects";
export const pricingSettingsCacheTag = "pricing-settings";
export const projectImagesBucket = "project-images";

const projectsCollection = "projects";
const projectSlugsCollection = "projectSlugs";
const settingsCollection = "settings";
const pricingSettingsDocument = "pricing";

type ProjectImageDocument = {
  id: string;
  storagePath: string;
  publicUrl?: string;
  downloadToken?: string;
  altText: string;
  sortOrder: number;
  isCover: boolean;
};

type ProjectDocument = {
  id?: string;
  slug: string;
  title: string;
  status: string;
  buildTypeSlug: string;
  finishLevelSlug: string;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  location: string;
  shortDescription: string;
  fullDescription: string;
  featured: boolean;
  createdAt: unknown;
  updatedAt: unknown;
  revision?: unknown;
  images?: ProjectImageDocument[];
};

type PricingSettingsDocument = {
  builderGradePricePerSqft?: number | string | null;
  builderPlusPricePerSqft?: number | string | null;
  customPricePerSqft?: number | string | null;
  pricingNote?: string | null;
  updatedAt?: unknown;
};

function parseNumericValue(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsedValue = Number.parseFloat(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function toIsoString(value: unknown, fieldName: string) {
  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "string" || typeof value === "number") {
    date = new Date(value);
  } else if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    date = value.toDate();
  }

  if (!date || Number.isNaN(date.getTime())) {
    throw new Error(`Invalid Firestore timestamp in ${fieldName}.`);
  }

  return date.toISOString();
}

function toOptionalIsoString(value: unknown, fieldName: string) {
  return value === null || value === undefined
    ? null
    : toIsoString(value, fieldName);
}

function readProjectRevision(value: unknown) {
  if (value === undefined) {
    return 0;
  }

  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }

  throw new Error("Invalid Firestore project revision.");
}

function buildFirebaseStorageDownloadUrl(params: {
  bucketName: string;
  storagePath: string;
  downloadToken: string;
}) {
  return (
    `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(params.bucketName)}` +
    `/o/${encodeURIComponent(params.storagePath)}?alt=media&token=${encodeURIComponent(params.downloadToken)}`
  );
}

function resolveProjectImagePublicUrl(image: ProjectImageDocument) {
  if (image.publicUrl) {
    return image.publicUrl;
  }

  if (!image.downloadToken) {
    return "";
  }

  try {
    return buildFirebaseStorageDownloadUrl({
      bucketName: getFirebaseStorageBucket().name,
      storagePath: image.storagePath,
      downloadToken: image.downloadToken,
    });
  } catch {
    return "";
  }
}

function sortProjectImages(images: ProjectImage[]) {
  return [...images].sort((leftImage, rightImage) => {
    if (leftImage.isCover !== rightImage.isCover) {
      return leftImage.isCover ? -1 : 1;
    }

    if (leftImage.sortOrder !== rightImage.sortOrder) {
      return leftImage.sortOrder - rightImage.sortOrder;
    }

    return leftImage.id.localeCompare(rightImage.id);
  });
}

function mapProjectImage(image: ProjectImageDocument): ProjectImage {
  return {
    id: image.id,
    storagePath: image.storagePath,
    publicUrl: resolveProjectImagePublicUrl(image),
    altText: image.altText ?? "",
    sortOrder: image.sortOrder,
    isCover: image.isCover,
  };
}

function mapProjectSummary(
  projectId: string,
  project: ProjectDocument,
): ProjectSummary {
  const images = sortProjectImages((project.images ?? []).map(mapProjectImage));
  const coverImage = images.find((image) => image.isCover) ?? images[0] ?? null;

  return {
    id: projectId,
    slug: project.slug,
    title: project.title,
    status: project.status as ProjectSummary["status"],
    buildTypeSlug: project.buildTypeSlug as ProjectSummary["buildTypeSlug"],
    finishLevelSlug:
      project.finishLevelSlug as ProjectSummary["finishLevelSlug"],
    squareFootage: project.squareFootage,
    bedrooms: project.bedrooms,
    bathrooms: project.bathrooms,
    location: project.location,
    shortDescription: project.shortDescription,
    featured: project.featured,
    createdAt: toIsoString(project.createdAt, "projects.createdAt"),
    updatedAt: toIsoString(project.updatedAt, "projects.updatedAt"),
    coverImage,
  };
}

function mapProjectDetail(
  projectId: string,
  project: ProjectDocument,
): ProjectDetail {
  const summary = mapProjectSummary(projectId, project);

  return {
    ...summary,
    fullDescription: project.fullDescription,
    images: sortProjectImages((project.images ?? []).map(mapProjectImage)),
    revision: readProjectRevision(project.revision),
  };
}

function mapPricingSettings(
  document: PricingSettingsDocument | null,
): PricingSettings {
  if (!document) {
    return {
      builderGradePricePerSqft: null,
      builderPlusPricePerSqft: null,
      customPricePerSqft: null,
      pricingNote: null,
      updatedAt: null,
    };
  }

  return {
    builderGradePricePerSqft: parseNumericValue(
      document.builderGradePricePerSqft,
    ),
    builderPlusPricePerSqft: parseNumericValue(
      document.builderPlusPricePerSqft,
    ),
    customPricePerSqft: parseNumericValue(document.customPricePerSqft),
    pricingNote: document.pricingNote ?? null,
    updatedAt: toOptionalIsoString(
      document.updatedAt,
      "settings/pricing.updatedAt",
    ),
  };
}

function formatDataError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function logPublicDataFallback(resource: string, error: unknown) {
  console.warn(
    `[public-data-fallback] Returning a safe default for ${resource}: ${formatDataError(error)}`,
  );
}

function sortProjectSummaries(projects: ProjectSummary[]) {
  return [...projects].sort((leftProject, rightProject) => {
    if (leftProject.featured !== rightProject.featured) {
      return leftProject.featured ? -1 : 1;
    }

    if (leftProject.status !== rightProject.status) {
      return leftProject.status === "for-sale" ? -1 : 1;
    }

    return rightProject.createdAt.localeCompare(leftProject.createdAt);
  });
}

async function getProjectDocumentById(projectId: string) {
  const projectSnapshot = await getFirebaseDatabase()
    .collection(projectsCollection)
    .doc(projectId)
    .get();

  return projectSnapshot.exists
    ? (projectSnapshot.data() as ProjectDocument)
    : null;
}

async function queryPublicProjects() {
  if (!isFirebaseAdminConfigured()) {
    return [] as ProjectSummary[];
  }

  const projectsSnapshot = await getFirebaseDatabase()
    .collection(projectsCollection)
    .get();
  const projects = projectsSnapshot.docs.map((projectSnapshot) =>
    mapProjectSummary(
      projectSnapshot.id,
      projectSnapshot.data() as ProjectDocument,
    ),
  );

  return sortProjectSummaries(projects);
}

async function queryPublicProjectBySlug(projectSlug: string) {
  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  const database = getFirebaseDatabase();
  const slugSnapshot = await database
    .collection(projectSlugsCollection)
    .doc(projectSlug)
    .get();

  if (!slugSnapshot.exists) {
    return null;
  }

  const projectId = slugSnapshot.get("projectId");

  if (typeof projectId !== "string" || !projectId) {
    throw new Error(`Project slug reservation "${projectSlug}" is invalid.`);
  }

  const project = await getProjectDocumentById(projectId);

  if (!project) {
    throw new Error(`Project slug reservation "${projectSlug}" is stale.`);
  }

  if (project.slug !== projectSlug) {
    throw new Error(`Project slug reservation "${projectSlug}" is inconsistent.`);
  }

  return mapProjectDetail(projectId, project);
}

async function queryPricingSettings() {
  if (!isFirebaseAdminConfigured()) {
    return mapPricingSettings(null);
  }

  const pricingSnapshot = await getFirebaseDatabase()
    .collection(settingsCollection)
    .doc(pricingSettingsDocument)
    .get();

  return mapPricingSettings(
    pricingSnapshot.exists
      ? (pricingSnapshot.data() as PricingSettingsDocument)
      : null,
  );
}

const getCachedPublicProjects = unstable_cache(
  async () => {
    try {
      return await queryPublicProjects();
    } catch (error) {
      logPublicDataFallback("projects", error);
      return [] as ProjectSummary[];
    }
  },
  ["public-projects"],
  {
    tags: [projectCacheTag],
  },
);

const getCachedPublicProjectBySlug = unstable_cache(
  async (projectSlug: string) => {
    try {
      return await queryPublicProjectBySlug(projectSlug);
    } catch (error) {
      logPublicDataFallback(`project "${projectSlug}"`, error);
      return null;
    }
  },
  ["public-project-by-slug"],
  {
    tags: [projectCacheTag],
  },
);

const getCachedPricingSettings = unstable_cache(
  async () => {
    try {
      return await queryPricingSettings();
    } catch (error) {
      logPublicDataFallback("pricing settings", error);
      return mapPricingSettings(null);
    }
  },
  ["pricing-settings"],
  {
    tags: [pricingSettingsCacheTag],
  },
);

export async function getPublicProjects() {
  return getCachedPublicProjects();
}

export async function getPublicProjectBySlug(projectSlug: string) {
  return getCachedPublicProjectBySlug(projectSlug);
}

export async function getPublicPricingSettings() {
  return getCachedPricingSettings();
}

export async function listAdminProjects() {
  return queryPublicProjects();
}

export async function getAdminProjectById(projectId: string) {
  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  const project = await getProjectDocumentById(projectId);
  return project ? mapProjectDetail(projectId, project) : null;
}

export async function getAdminPricingSettings() {
  return queryPricingSettings();
}

export async function getProjectSlugAvailability(
  slug: string,
  currentProjectId?: string,
) {
  if (!isFirebaseAdminConfigured()) {
    return true;
  }

  const slugSnapshot = await getFirebaseDatabase()
    .collection(projectSlugsCollection)
    .doc(slug)
    .get();

  if (!slugSnapshot.exists) {
    return true;
  }

  return Boolean(
    currentProjectId && slugSnapshot.get("projectId") === currentProjectId,
  );
}

function getFileExtension(file: File) {
  const extensionFromName = file.name.split(".").pop()?.toLowerCase();

  if (extensionFromName) {
    return extensionFromName.replace(/[^a-z0-9]/g, "") || "jpg";
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  if (file.type === "image/avif") {
    return "avif";
  }

  return "jpg";
}

async function uploadProjectImage(params: {
  projectId: string;
  file: File;
}) {
  const bucket = getFirebaseStorageBucket();
  const fileExtension = getFileExtension(params.file);
  const storagePath = `projects/${params.projectId}/${crypto.randomUUID()}.${fileExtension}`;
  const downloadToken = crypto.randomUUID();
  const storageFile = bucket.file(storagePath);
  const fileBuffer = Buffer.from(await params.file.arrayBuffer());

  try {
    await storageFile.save(fileBuffer, {
      resumable: false,
      validation: "crc32c",
      metadata: {
        contentType: params.file.type,
        cacheControl: "public,max-age=3600",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });
  } catch (error) {
    await storageFile.delete({ ignoreNotFound: true }).catch(() => undefined);
    throw new Error(`Failed to upload image: ${formatDataError(error)}`);
  }

  return {
    storagePath,
    downloadToken,
    publicUrl: buildFirebaseStorageDownloadUrl({
      bucketName: bucket.name,
      storagePath,
      downloadToken,
    }),
  };
}

async function removeStorageFiles(storagePaths: string[]) {
  if (!storagePaths.length || !isFirebaseAdminConfigured()) {
    return;
  }

  try {
    const bucket = getFirebaseStorageBucket();
    const deleteResults = await Promise.allSettled(
      storagePaths.map((storagePath) =>
        bucket.file(storagePath).delete({ ignoreNotFound: true }),
      ),
    );
    const failures = deleteResults.filter((result) => result.status === "rejected");

    if (failures.length > 0) {
      console.error(
        `Failed to remove ${failures.length} project image file(s) from Firebase Storage.`,
      );
    }
  } catch (error) {
    console.error("Failed to remove project image files", error);
  }
}

export async function saveProject(params: {
  project: ProjectWriteInput;
  existingImages: ExistingProjectImageFormInput[];
  coverImage: File | null;
  galleryImages: File[];
  expectedRevision?: number;
}) {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase admin credentials are not configured.");
  }

  const database = getFirebaseDatabase();
  const projectId = params.project.id ?? crypto.randomUUID();
  const isNewProject = !params.project.id;
  const uploadedStoragePaths: string[] = [];
  let projectPersisted = false;

  const currentProject = isNewProject
    ? null
    : await getProjectDocumentById(projectId);

  if (!isNewProject && !currentProject) {
    throw new Error("The project could not be found.");
  }

  const currentImagesById = new Map(
    (currentProject?.images ?? []).map((image) => [image.id, image]),
  );
  const retainedExistingImages = params.existingImages.filter(
    (image) => !image.remove,
  );
  const removedExistingImages = params.existingImages.filter(
    (image) => image.remove,
  );
  const currentMaxSortOrder = retainedExistingImages.reduce(
    (highestSortOrder, image) => Math.max(highestSortOrder, image.sortOrder),
    -1,
  );
  let nextSortOrder = currentMaxSortOrder + 1;

  const finalExistingImages = retainedExistingImages.map((image) => {
    const currentImage = currentImagesById.get(image.id);

    if (!currentImage) {
      throw new Error("An existing project image could not be resolved.");
    }

    return {
      id: image.id,
      storagePath: currentImage.storagePath,
      publicUrl: resolveProjectImagePublicUrl(currentImage),
      ...(currentImage.downloadToken
        ? { downloadToken: currentImage.downloadToken }
        : {}),
      altText: image.altText || currentImage.altText,
      sortOrder: image.sortOrder,
      isCover: image.isCover,
    } satisfies ProjectImageDocument;
  });

  try {
    let newCoverImageRecord: ProjectImageDocument | null = null;

    if (params.coverImage) {
      const uploadedImage = await uploadProjectImage({
        projectId,
        file: params.coverImage,
      });

      uploadedStoragePaths.push(uploadedImage.storagePath);
      newCoverImageRecord = {
        id: crypto.randomUUID(),
        ...uploadedImage,
        altText:
          params.project.coverAltText ?? `${params.project.title} cover image`,
        sortOrder: nextSortOrder++,
        isCover: true,
      };
    }

    const newGalleryImageRecords: ProjectImageDocument[] = [];

    for (const [index, file] of params.galleryImages.entries()) {
      const uploadedImage = await uploadProjectImage({
        projectId,
        file,
      });

      uploadedStoragePaths.push(uploadedImage.storagePath);
      newGalleryImageRecords.push({
        id: crypto.randomUUID(),
        ...uploadedImage,
        altText: `${params.project.title} gallery image ${index + 1}`,
        sortOrder: nextSortOrder++,
        isCover: false,
      });
    }

    const finalImages = [
      ...finalExistingImages,
      ...(newCoverImageRecord ? [newCoverImageRecord] : []),
      ...newGalleryImageRecords,
    ];

    if (finalImages.length === 0) {
      throw new Error("At least one project image is required.");
    }

    const resolvedCoverImageId =
      newCoverImageRecord?.id ??
      finalExistingImages.find((image) => image.isCover)?.id ??
      finalImages
        .slice()
        .sort((leftImage, rightImage) => leftImage.sortOrder - rightImage.sortOrder)[0]
        ?.id;

    if (!resolvedCoverImageId) {
      throw new Error("A cover image is required before publishing a project.");
    }

    const normalizedImages = finalImages.map((image) => ({
      ...image,
      isCover: image.id === resolvedCoverImageId,
      altText: image.altText || `${params.project.title} project image`,
    }));
    const projectReference = database
      .collection(projectsCollection)
      .doc(projectId);
    const newSlugReference = database
      .collection(projectSlugsCollection)
      .doc(params.project.slug);

    await database.runTransaction(async (transaction) => {
      const projectSnapshot = await transaction.get(projectReference);

      if (isNewProject && projectSnapshot.exists) {
        throw new Error("A project with this ID already exists.");
      }

      if (!isNewProject && !projectSnapshot.exists) {
        throw new Error("The project could not be found.");
      }

      const currentRevision = projectSnapshot.exists
        ? readProjectRevision(projectSnapshot.get("revision"))
        : 0;

      if (
        !isNewProject &&
        (params.expectedRevision === undefined ||
          params.expectedRevision !== currentRevision)
      ) {
        throw new Error(
          "This project changed after you opened it. Reload the page and review the latest version before saving again.",
        );
      }

      const previousSlug = projectSnapshot.exists
        ? (projectSnapshot.get("slug") as unknown)
        : null;
      const previousSlugReference =
        typeof previousSlug === "string" && previousSlug !== params.project.slug
          ? database.collection(projectSlugsCollection).doc(previousSlug)
          : null;
      const newSlugSnapshot = await transaction.get(newSlugReference);
      const previousSlugSnapshot = previousSlugReference
        ? await transaction.get(previousSlugReference)
        : null;
      const reservedProjectId = newSlugSnapshot.exists
        ? newSlugSnapshot.get("projectId")
        : null;

      if (newSlugSnapshot.exists && reservedProjectId !== projectId) {
        throw new Error("That slug is already in use by another project.");
      }

      const now = new Date();
      const createdAt = projectSnapshot.exists
        ? (projectSnapshot.get("createdAt") ?? now)
        : now;

      transaction.set(projectReference, {
        id: projectId,
        slug: params.project.slug,
        title: params.project.title,
        status: params.project.status,
        buildTypeSlug: params.project.buildTypeSlug,
        finishLevelSlug: params.project.finishLevelSlug,
        squareFootage: params.project.squareFootage,
        bedrooms: params.project.bedrooms,
        bathrooms: params.project.bathrooms,
        location: params.project.location,
        shortDescription: params.project.shortDescription,
        fullDescription: params.project.fullDescription,
        featured: params.project.featured,
        createdAt,
        updatedAt: now,
        revision: currentRevision + 1,
        images: normalizedImages,
      });
      transaction.set(newSlugReference, { projectId });

      if (
        previousSlugReference &&
        previousSlugSnapshot?.exists &&
        previousSlugSnapshot.get("projectId") === projectId
      ) {
        transaction.delete(previousSlugReference);
      }
    });

    projectPersisted = true;

    await removeStorageFiles(
      removedExistingImages
        .map((image) => currentImagesById.get(image.id)?.storagePath)
        .filter((storagePath): storagePath is string => Boolean(storagePath)),
    );

    return {
      id: projectId,
      slug: params.project.slug,
    };
  } catch (error) {
    if (!projectPersisted) {
      await removeStorageFiles(uploadedStoragePaths);
    }

    throw error;
  }
}

export async function upsertPricingSettings(input: PricingWriteInput) {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase admin credentials are not configured.");
  }

  await getFirebaseDatabase()
    .collection(settingsCollection)
    .doc(pricingSettingsDocument)
    .set({
      builderGradePricePerSqft: input.builderGradePricePerSqft,
      builderPlusPricePerSqft: input.builderPlusPricePerSqft,
      customPricePerSqft: input.customPricePerSqft,
      pricingNote: input.pricingNote,
      updatedAt: new Date(),
    });
}
