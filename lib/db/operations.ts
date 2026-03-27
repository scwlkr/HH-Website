import "server-only";

import { unstable_cache } from "next/cache";
import { env } from "@/lib/env";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/db/client";
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

type ProjectImageRow = {
  id: string;
  project_id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  is_cover: boolean;
};

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  build_type_slug: string;
  finish_level_slug: string;
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  location: string;
  short_description: string;
  full_description: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
  project_images?: ProjectImageRow[] | null;
};

type PricingSettingsRow = {
  builder_grade_price_per_sqft: number | string | null;
  builder_plus_price_per_sqft: number | string | null;
  custom_price_per_sqft: number | string | null;
  pricing_note: string | null;
  updated_at: string | null;
};

function parseNumericValue(value: number | string | null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsedValue = Number.parseFloat(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function buildProjectImagePublicUrl(storagePath: string) {
  if (!env.supabaseUrl) {
    return "";
  }

  const normalizedBaseUrl = env.supabaseUrl.replace(/\/$/, "");
  return `${normalizedBaseUrl}/storage/v1/object/public/${projectImagesBucket}/${storagePath}`;
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

function mapProjectImage(row: ProjectImageRow): ProjectImage {
  return {
    id: row.id,
    storagePath: row.storage_path,
    publicUrl: buildProjectImagePublicUrl(row.storage_path),
    altText: row.alt_text ?? "",
    sortOrder: row.sort_order,
    isCover: row.is_cover,
  };
}

function mapProjectSummary(row: ProjectRow): ProjectSummary {
  const images = sortProjectImages((row.project_images ?? []).map(mapProjectImage));
  const coverImage = images.find((image) => image.isCover) ?? images[0] ?? null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status as ProjectSummary["status"],
    buildTypeSlug: row.build_type_slug as ProjectSummary["buildTypeSlug"],
    finishLevelSlug: row.finish_level_slug as ProjectSummary["finishLevelSlug"],
    squareFootage: row.square_footage,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    location: row.location,
    shortDescription: row.short_description,
    featured: row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    coverImage,
  };
}

function mapProjectDetail(row: ProjectRow): ProjectDetail {
  const summary = mapProjectSummary(row);

  return {
    ...summary,
    fullDescription: row.full_description,
    images: sortProjectImages((row.project_images ?? []).map(mapProjectImage)),
  };
}

function mapPricingSettings(row: PricingSettingsRow | null): PricingSettings {
  if (!row) {
    return {
      builderGradePricePerSqft: null,
      builderPlusPricePerSqft: null,
      customPricePerSqft: null,
      pricingNote: null,
      updatedAt: null,
    };
  }

  return {
    builderGradePricePerSqft: parseNumericValue(row.builder_grade_price_per_sqft),
    builderPlusPricePerSqft: parseNumericValue(row.builder_plus_price_per_sqft),
    customPricePerSqft: parseNumericValue(row.custom_price_per_sqft),
    pricingNote: row.pricing_note,
    updatedAt: row.updated_at,
  };
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

async function queryPublicProjects() {
  if (!isSupabaseAdminConfigured()) {
    return [] as ProjectSummary[];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, slug, title, status, build_type_slug, finish_level_slug, square_footage, bedrooms, bathrooms, location, short_description, full_description, featured, created_at, updated_at, project_images(id, project_id, storage_path, alt_text, sort_order, is_cover)",
    );

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  return sortProjectSummaries((data ?? []).map((row) => mapProjectSummary(row as ProjectRow)));
}

async function queryPublicProjectBySlug(projectSlug: string) {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, slug, title, status, build_type_slug, finish_level_slug, square_footage, bedrooms, bathrooms, location, short_description, full_description, featured, created_at, updated_at, project_images(id, project_id, storage_path, alt_text, sort_order, is_cover)",
    )
    .eq("slug", projectSlug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch project detail: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapProjectDetail(data as ProjectRow);
}

async function queryPricingSettings() {
  if (!isSupabaseAdminConfigured()) {
    return mapPricingSettings(null);
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pricing_settings")
    .select(
      "builder_grade_price_per_sqft, builder_plus_price_per_sqft, custom_price_per_sqft, pricing_note, updated_at",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch pricing settings: ${error.message}`);
  }

  return mapPricingSettings((data as PricingSettingsRow | null) ?? null);
}

const getCachedPublicProjects = unstable_cache(queryPublicProjects, ["public-projects"], {
  tags: [projectCacheTag],
});

const getCachedPublicProjectBySlug = unstable_cache(
  queryPublicProjectBySlug,
  ["public-project-by-slug"],
  {
    tags: [projectCacheTag],
  },
);

const getCachedPricingSettings = unstable_cache(queryPricingSettings, ["pricing-settings"], {
  tags: [pricingSettingsCacheTag],
});

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
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, slug, title, status, build_type_slug, finish_level_slug, square_footage, bedrooms, bathrooms, location, short_description, full_description, featured, created_at, updated_at, project_images(id, project_id, storage_path, alt_text, sort_order, is_cover)",
    )
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch project by id: ${error.message}`);
  }

  return data ? mapProjectDetail(data as ProjectRow) : null;
}

export async function getAdminPricingSettings() {
  return queryPricingSettings();
}

export async function getProjectSlugAvailability(
  slug: string,
  currentProjectId?: string,
) {
  if (!isSupabaseAdminConfigured()) {
    return true;
  }

  const supabase = getSupabaseAdminClient();
  let query = supabase.from("projects").select("id").eq("slug", slug).limit(1);

  if (currentProjectId) {
    query = query.neq("id", currentProjectId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to validate slug uniqueness: ${error.message}`);
  }

  return (data ?? []).length === 0;
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
  const supabase = getSupabaseAdminClient();
  const fileExtension = getFileExtension(params.file);
  const storagePath = `projects/${params.projectId}/${crypto.randomUUID()}.${fileExtension}`;
  const fileBuffer = Buffer.from(await params.file.arrayBuffer());
  const { error } = await supabase.storage
    .from(projectImagesBucket)
    .upload(storagePath, fileBuffer, {
      contentType: params.file.type,
      upsert: false,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  return storagePath;
}

async function removeStorageFiles(storagePaths: string[]) {
  if (!storagePaths.length || !isSupabaseAdminConfigured()) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.storage
    .from(projectImagesBucket)
    .remove(storagePaths);

  if (error) {
    console.error("Failed to remove project image files", error);
  }
}

export async function saveProject(params: {
  project: ProjectWriteInput;
  existingImages: ExistingProjectImageFormInput[];
  coverImage: File | null;
  galleryImages: File[];
}) {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase admin credentials are not configured.");
  }

  const supabase = getSupabaseAdminClient();
  const projectId = params.project.id ?? crypto.randomUUID();
  const isNewProject = !params.project.id;
  const uploadedStoragePaths: string[] = [];

  const currentProject = isNewProject
    ? null
    : await getAdminProjectById(params.project.id as string);
  const currentImagesById = new Map(
    (currentProject?.images ?? []).map((image) => [image.id, image]),
  );
  const retainedExistingImages = params.existingImages.filter((image) => !image.remove);
  const removedExistingImages = params.existingImages.filter((image) => image.remove);
  const currentMaxSortOrder = retainedExistingImages.reduce(
    (highestSortOrder, image) => Math.max(highestSortOrder, image.sortOrder),
    -1,
  );
  let nextSortOrder = currentMaxSortOrder + 1;

  try {
    let newCoverImageRecord:
      | {
          id: string;
          project_id: string;
          storage_path: string;
          alt_text: string;
          sort_order: number;
          is_cover: boolean;
        }
      | null = null;

    if (params.coverImage) {
      const storagePath = await uploadProjectImage({
        projectId,
        file: params.coverImage,
      });

      uploadedStoragePaths.push(storagePath);
      newCoverImageRecord = {
        id: crypto.randomUUID(),
        project_id: projectId,
        storage_path: storagePath,
        alt_text:
          params.project.coverAltText ?? `${params.project.title} cover image`,
        sort_order: nextSortOrder++,
        is_cover: true,
      };
    }

    const newGalleryImageRecords = [];

    for (const [index, file] of params.galleryImages.entries()) {
      const storagePath = await uploadProjectImage({
        projectId,
        file,
      });

      uploadedStoragePaths.push(storagePath);
      newGalleryImageRecords.push({
        id: crypto.randomUUID(),
        project_id: projectId,
        storage_path: storagePath,
        alt_text: `${params.project.title} gallery image ${index + 1}`,
        sort_order: nextSortOrder++,
        is_cover: false,
      });
    }

    const finalExistingImages = retainedExistingImages.map((image) => {
      const currentImage = currentImagesById.get(image.id);

      if (!currentImage) {
        throw new Error("An existing project image could not be resolved.");
      }

      return {
        id: image.id,
        project_id: projectId,
        storage_path: currentImage.storagePath,
        alt_text: image.altText || currentImage.altText,
        sort_order: image.sortOrder,
        is_cover: image.isCover,
      };
    });

    const finalImageRows = [
      ...finalExistingImages,
      ...(newCoverImageRecord ? [newCoverImageRecord] : []),
      ...newGalleryImageRecords,
    ];

    if (finalImageRows.length === 0) {
      throw new Error("At least one project image is required.");
    }

    let resolvedCoverImageId = newCoverImageRecord?.id ?? null;

    if (!resolvedCoverImageId) {
      resolvedCoverImageId =
        finalExistingImages.find((image) => image.is_cover)?.id ??
        finalImageRows
          .slice()
          .sort((leftImage, rightImage) => leftImage.sort_order - rightImage.sort_order)[0]
          ?.id ??
        null;
    }

    if (!resolvedCoverImageId) {
      throw new Error("A cover image is required before publishing a project.");
    }

    const normalizedImageRows = finalImageRows.map((image) => ({
      ...image,
      is_cover: image.id === resolvedCoverImageId,
      alt_text: image.alt_text || `${params.project.title} project image`,
    }));

    const projectPayload = {
      id: projectId,
      slug: params.project.slug,
      title: params.project.title,
      status: params.project.status,
      build_type_slug: params.project.buildTypeSlug,
      finish_level_slug: params.project.finishLevelSlug,
      square_footage: params.project.squareFootage,
      bedrooms: params.project.bedrooms,
      bathrooms: params.project.bathrooms,
      location: params.project.location,
      short_description: params.project.shortDescription,
      full_description: params.project.fullDescription,
      featured: params.project.featured,
    };

    const projectMutation = isNewProject
      ? supabase.from("projects").insert(projectPayload)
      : supabase.from("projects").update(projectPayload).eq("id", projectId);
    const { error: projectError } = await projectMutation;

    if (projectError) {
      throw new Error(`Failed to save project: ${projectError.message}`);
    }

    const { error: resetCoverError } = await supabase
      .from("project_images")
      .update({ is_cover: false })
      .eq("project_id", projectId);

    if (resetCoverError) {
      throw new Error(`Failed to reset project cover image: ${resetCoverError.message}`);
    }

    const removedImageIds = removedExistingImages.map((image) => image.id);

    if (removedImageIds.length > 0) {
      const { error: deleteImageRowsError } = await supabase
        .from("project_images")
        .delete()
        .in("id", removedImageIds);

      if (deleteImageRowsError) {
        throw new Error(`Failed to remove deleted images: ${deleteImageRowsError.message}`);
      }
    }

    const { error: upsertImageRowsError } = await supabase
      .from("project_images")
      .upsert(normalizedImageRows);

    if (upsertImageRowsError) {
      throw new Error(`Failed to save project images: ${upsertImageRowsError.message}`);
    }

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
    await removeStorageFiles(uploadedStoragePaths);
    throw error;
  }
}

export async function upsertPricingSettings(input: PricingWriteInput) {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase admin credentials are not configured.");
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("pricing_settings").upsert({
    id: 1,
    builder_grade_price_per_sqft: input.builderGradePricePerSqft,
    builder_plus_price_per_sqft: input.builderPlusPricePerSqft,
    custom_price_per_sqft: input.customPricePerSqft,
    pricing_note: input.pricingNote,
  });

  if (error) {
    throw new Error(`Failed to save pricing settings: ${error.message}`);
  }
}
