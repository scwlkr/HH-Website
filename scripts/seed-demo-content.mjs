#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const projectImagesBucket = "project-images";
const assetRoot = path.join(process.cwd(), "public", "images");

const assetSpecs = [
  {
    outputPath: "build-types/single-family/front-elevation.jpg",
    label: "Single Family Front Elevation",
    background: "E8E2D7",
    foreground: "1D473A",
  },
  {
    outputPath: "build-types/single-family/living-space.jpg",
    label: "Single Family Living Space",
    background: "E4DDD0",
    foreground: "1D473A",
  },
  {
    outputPath: "build-types/single-family/rear-patio.jpg",
    label: "Single Family Rear Patio",
    background: "DDD4C6",
    foreground: "1D473A",
  },
  {
    outputPath: "build-types/multifamily/street-frontage.jpg",
    label: "Multifamily Street Frontage",
    background: "D9DED8",
    foreground: "244233",
  },
  {
    outputPath: "build-types/multifamily/common-lobby.jpg",
    label: "Multifamily Common Lobby",
    background: "D4D9D2",
    foreground: "244233",
  },
  {
    outputPath: "build-types/multifamily/courtyard.jpg",
    label: "Multifamily Courtyard",
    background: "CBD5C9",
    foreground: "244233",
  },
  {
    outputPath: "build-types/townhomes/block-composition.jpg",
    label: "Townhomes Block Composition",
    background: "E6DCCE",
    foreground: "5B3A29",
  },
  {
    outputPath: "build-types/townhomes/entry-sequence.jpg",
    label: "Townhomes Entry Sequence",
    background: "DFD1C1",
    foreground: "5B3A29",
  },
  {
    outputPath: "build-types/townhomes/interior-main-level.jpg",
    label: "Townhomes Main Level",
    background: "D7C7B5",
    foreground: "5B3A29",
  },
  {
    outputPath: "build-types/commercial/corner-entry.jpg",
    label: "Commercial Corner Entry",
    background: "DCE2E0",
    foreground: "1E3A3D",
  },
  {
    outputPath: "build-types/commercial/interior-work-zone.jpg",
    label: "Commercial Work Zone",
    background: "D3D9D7",
    foreground: "1E3A3D",
  },
  {
    outputPath: "build-types/commercial/tenant-frontage.jpg",
    label: "Commercial Tenant Frontage",
    background: "CAD2CF",
    foreground: "1E3A3D",
  },
  {
    outputPath: "finishes/builder-grade/street-elevation.jpg",
    label: "Builder Grade Street Elevation",
    background: "EEE8DD",
    foreground: "4D4437",
  },
  {
    outputPath: "finishes/builder-grade/kitchen-core-palette.jpg",
    label: "Builder Grade Kitchen Palette",
    background: "E6DFD2",
    foreground: "4D4437",
  },
  {
    outputPath: "finishes/builder-grade/bath-standard-fixtures.jpg",
    label: "Builder Grade Bath Fixtures",
    background: "DDD4C5",
    foreground: "4D4437",
  },
  {
    outputPath: "finishes/builder-plus/entry-material-layering.jpg",
    label: "Builder Plus Entry Layering",
    background: "E3DDD2",
    foreground: "345348",
  },
  {
    outputPath: "finishes/builder-plus/kitchen-upgraded-fixtures.jpg",
    label: "Builder Plus Kitchen Fixtures",
    background: "DAD5C9",
    foreground: "345348",
  },
  {
    outputPath: "finishes/builder-plus/primary-bath-curated-tile.jpg",
    label: "Builder Plus Curated Tile",
    background: "D0CCC1",
    foreground: "345348",
  },
  {
    outputPath: "finishes/custom/site-specific-exterior.jpg",
    label: "Custom Site Specific Exterior",
    background: "E6E1D8",
    foreground: "213445",
  },
  {
    outputPath: "finishes/custom/custom-kitchen-millwork.jpg",
    label: "Custom Kitchen Millwork",
    background: "DDD7CD",
    foreground: "213445",
  },
  {
    outputPath: "finishes/custom/feature-stair-and-gallery.jpg",
    label: "Custom Feature Stair Gallery",
    background: "D4CDC3",
    foreground: "213445",
  },
];

const sampleProjects = [
  {
    slug: "ridgeview-residence",
    title: "Ridgeview Residence",
    status: "for-sale",
    buildTypeSlug: "single-family",
    finishLevelSlug: "builder-plus",
    squareFootage: 3185,
    bedrooms: 4,
    bathrooms: 3.5,
    location: "Dripping Springs, Texas",
    shortDescription:
      "A hill-country single-family spec home with warm material layering, flexible family space, and a quieter backyard sequence.",
    fullDescription:
      "Ridgeview Residence is seeded as a demo listing for the operations portal. It represents a finished single-family home with a Builder+ interior package, a stronger arrival sequence, and a covered rear patio that extends the primary living spaces outdoors. The record exists to verify that the public projects grid, detail route, status badge, and Supabase image relationships all update cleanly from the admin workflow.",
    featured: true,
    coverAltText: "Ridgeview Residence exterior placeholder image",
    imagePaths: [
      "build-types/single-family/front-elevation.jpg",
      "build-types/single-family/living-space.jpg",
      "build-types/single-family/rear-patio.jpg",
    ],
  },
  {
    slug: "market-court-townhomes",
    title: "Market Court Townhomes",
    status: "sold",
    buildTypeSlug: "townhomes",
    finishLevelSlug: "builder-grade",
    squareFootage: 2140,
    bedrooms: 3,
    bathrooms: 2.5,
    location: "New Braunfels, Texas",
    shortDescription:
      "A sold townhome block seeded to verify status handling, repeatable image uploads, and public archive rendering.",
    fullDescription:
      "Market Court Townhomes is a seeded sold project used to prove that townhome inventory, finish level metadata, and image galleries are surviving the full admin save path. The entry models an attached-housing product with a disciplined exterior rhythm, efficient main-level planning, and baseline finish selections suited to repeatable delivery.",
    featured: false,
    coverAltText: "Market Court Townhomes street-facing placeholder image",
    imagePaths: [
      "build-types/townhomes/block-composition.jpg",
      "build-types/townhomes/entry-sequence.jpg",
      "build-types/townhomes/interior-main-level.jpg",
    ],
  },
];

function getSupabaseConfig() {
  const supabaseUrl =
    process.env.SUPABASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
  }

  return {
    supabaseUrl,
    serviceRoleKey,
  };
}

function createPlaceholderUrl({
  background,
  foreground,
  label,
}) {
  const encodedLabel = encodeURIComponent(label.replace(/\s+/g, "\n"));
  return `https://placehold.co/1600x1100/${background}/${foreground}.jpg?font=playfair-display&text=${encodedLabel}`;
}

async function ensureCatalogAssets() {
  for (const assetSpec of assetSpecs) {
    const absolutePath = path.join(assetRoot, assetSpec.outputPath);
    await mkdir(path.dirname(absolutePath), { recursive: true });

    const response = await fetch(createPlaceholderUrl(assetSpec));

    if (!response.ok) {
      throw new Error(
        `Failed to download placeholder image for ${assetSpec.outputPath}: ${response.status}`,
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(absolutePath, buffer);
  }
}

function createSupabaseAdminClient() {
  const { supabaseUrl, serviceRoleKey } = getSupabaseConfig();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function readAssetBuffer(relativeImagePath) {
  return readFile(path.join(assetRoot, relativeImagePath));
}

async function removeStorageFiles(supabase, storagePaths) {
  if (!storagePaths.length) {
    return;
  }

  const { error } = await supabase.storage
    .from(projectImagesBucket)
    .remove(storagePaths);

  if (error) {
    throw new Error(`Failed to remove storage files: ${error.message}`);
  }
}

async function deleteProjects(supabase, slugs) {
  if (!slugs.length) {
    return;
  }

  const { data: existingProjects, error: fetchError } = await supabase
    .from("projects")
    .select("id, slug, project_images(storage_path)")
    .in("slug", slugs);

  if (fetchError) {
    throw new Error(`Failed to look up projects for deletion: ${fetchError.message}`);
  }

  const storagePaths = (existingProjects ?? []).flatMap((project) =>
    (project.project_images ?? []).map((image) => image.storage_path),
  );

  await removeStorageFiles(supabase, storagePaths);

  const projectIds = (existingProjects ?? []).map((project) => project.id);

  if (projectIds.length) {
    const { error } = await supabase.from("projects").delete().in("id", projectIds);

    if (error) {
      throw new Error(`Failed to delete existing projects: ${error.message}`);
    }
  }
}

async function uploadProjectImage({
  supabase,
  projectId,
  fileName,
  buffer,
}) {
  const storagePath = `projects/${projectId}/${fileName}`;
  const { error } = await supabase.storage
    .from(projectImagesBucket)
    .upload(storagePath, buffer, {
      upsert: true,
      contentType: "image/jpeg",
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Failed to upload ${storagePath}: ${error.message}`);
  }

  return storagePath;
}

async function upsertSampleProject(supabase, project) {
  const { data: existingProject, error: existingProjectError } = await supabase
    .from("projects")
    .select("id, project_images(id, storage_path)")
    .eq("slug", project.slug)
    .maybeSingle();

  if (existingProjectError) {
    throw new Error(
      `Failed to look up project ${project.slug}: ${existingProjectError.message}`,
    );
  }

  const projectId = existingProject?.id ?? crypto.randomUUID();
  const existingStoragePaths = (existingProject?.project_images ?? []).map(
    (image) => image.storage_path,
  );

  if (existingStoragePaths.length) {
    await removeStorageFiles(supabase, existingStoragePaths);
  }

  const { error: upsertProjectError } = await supabase.from("projects").upsert({
    id: projectId,
    slug: project.slug,
    title: project.title,
    status: project.status,
    build_type_slug: project.buildTypeSlug,
    finish_level_slug: project.finishLevelSlug,
    square_footage: project.squareFootage,
    bedrooms: project.bedrooms,
    bathrooms: project.bathrooms,
    location: project.location,
    short_description: project.shortDescription,
    full_description: project.fullDescription,
    featured: project.featured,
  });

  if (upsertProjectError) {
    throw new Error(`Failed to upsert project ${project.slug}: ${upsertProjectError.message}`);
  }

  const { error: deleteImagesError } = await supabase
    .from("project_images")
    .delete()
    .eq("project_id", projectId);

  if (deleteImagesError) {
    throw new Error(
      `Failed to clear prior images for ${project.slug}: ${deleteImagesError.message}`,
    );
  }

  const uploadedImageRows = [];

  for (const [index, relativeImagePath] of project.imagePaths.entries()) {
    const imageBuffer = await readAssetBuffer(relativeImagePath);
    const storagePath = await uploadProjectImage({
      supabase,
      projectId,
      fileName: `${project.slug}-${index + 1}.jpg`,
      buffer: imageBuffer,
    });

    uploadedImageRows.push({
      id: crypto.randomUUID(),
      project_id: projectId,
      storage_path: storagePath,
      alt_text:
        index === 0
          ? project.coverAltText
          : `${project.title} gallery image ${index}`,
      sort_order: index,
      is_cover: index === 0,
    });
  }

  const { error: insertImagesError } = await supabase
    .from("project_images")
    .insert(uploadedImageRows);

  if (insertImagesError) {
    throw new Error(
      `Failed to insert images for ${project.slug}: ${insertImagesError.message}`,
    );
  }
}

async function seedProjects() {
  const supabase = createSupabaseAdminClient();
  const debugProjectSlugs = [
    "debug-1774661380531",
    "playwright-1774661718607",
  ];

  await deleteProjects(
    supabase,
    debugProjectSlugs.concat(
      sampleProjects.map((project) => project.slug),
    ),
  );

  for (const project of sampleProjects) {
    await upsertSampleProject(supabase, project);
  }
}

async function main() {
  await ensureCatalogAssets();
  await seedProjects();

  console.log(
    JSON.stringify(
      {
        catalogAssetsSeeded: assetSpecs.length,
        projectsSeeded: sampleProjects.map((project) => project.slug),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
