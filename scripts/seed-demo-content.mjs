#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  applicationDefault,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

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
    published: false,
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
      "Ridgeview Residence is seeded as a demo listing for the operations portal. It represents a finished single-family home with a Builder+ interior package, a stronger arrival sequence, and a covered rear patio that extends the primary living spaces outdoors. The record exists to verify that the public projects grid, detail route, status badge, and Firebase image metadata all update cleanly from the admin workflow.",
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
    published: false,
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

function readOptionalEnv(name) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function getFirebaseConfig() {
  const projectId =
    readOptionalEnv("FIREBASE_PROJECT_ID") ??
    readOptionalEnv("GOOGLE_CLOUD_PROJECT") ??
    readOptionalEnv("GCLOUD_PROJECT") ??
    readOptionalEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  const storageBucket =
    readOptionalEnv("FIREBASE_STORAGE_BUCKET") ??
    readOptionalEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");

  if (!projectId || !storageBucket) {
    throw new Error(
      "FIREBASE_PROJECT_ID and FIREBASE_STORAGE_BUCKET are required.",
    );
  }

  return { projectId, storageBucket };
}

function requireFirebaseEmulators() {
  const firestoreEmulatorHost = readOptionalEnv("FIRESTORE_EMULATOR_HOST");
  const storageEmulatorHost = readOptionalEnv(
    "FIREBASE_STORAGE_EMULATOR_HOST",
  );

  if (!firestoreEmulatorHost || !storageEmulatorHost) {
    throw new Error(
      "Refusing to seed demo project records outside the Firebase Emulator Suite. Set both FIRESTORE_EMULATOR_HOST and FIREBASE_STORAGE_EMULATOR_HOST.",
    );
  }
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

function createFirebaseAdminServices() {
  const { projectId, storageBucket } = getFirebaseConfig();
  const app =
    getApps()[0] ??
    initializeApp({
      credential: applicationDefault(),
      projectId,
      storageBucket,
    });

  return {
    database: getFirestore(app),
    bucket: getStorage(app).bucket(storageBucket),
  };
}

async function readAssetBuffer(relativeImagePath) {
  return readFile(path.join(assetRoot, relativeImagePath));
}

async function removeStorageFiles(bucket, storagePaths) {
  if (!storagePaths.length) {
    return;
  }

  await Promise.all(
    storagePaths.map((storagePath) =>
      bucket.file(storagePath).delete({ ignoreNotFound: true }),
    ),
  );
}

async function deleteProjects(database, bucket, slugs) {
  if (!slugs.length) {
    return;
  }

  const projectsSnapshot = await database
    .collection("projects")
    .where("slug", "in", slugs)
    .get();
  const storagePaths = projectsSnapshot.docs.flatMap((projectSnapshot) => {
    const images = projectSnapshot.get("images");
    return Array.isArray(images)
      ? images
          .map((image) => image?.storagePath)
          .filter((storagePath) => typeof storagePath === "string")
      : [];
  });

  await removeStorageFiles(bucket, storagePaths);

  const batch = database.batch();

  for (const projectSnapshot of projectsSnapshot.docs) {
    batch.delete(projectSnapshot.ref);
  }

  for (const slug of slugs) {
    batch.delete(database.collection("projectSlugs").doc(slug));
  }

  await batch.commit();
}

async function uploadProjectImage({
  bucket,
  projectId,
  fileName,
  buffer,
}) {
  const storagePath = `projects/${projectId}/${fileName}`;
  const downloadToken = crypto.randomUUID();

  await bucket.file(storagePath).save(buffer, {
    resumable: false,
    validation: "crc32c",
    metadata: {
      contentType: "image/jpeg",
      cacheControl: "public,max-age=3600",
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  });

  const storageEmulatorHost = readOptionalEnv(
    "FIREBASE_STORAGE_EMULATOR_HOST",
  );
  const storageApiOrigin = storageEmulatorHost
    ? storageEmulatorHost.startsWith("http://") ||
      storageEmulatorHost.startsWith("https://")
      ? storageEmulatorHost.replace(/\/$/, "")
      : `http://${storageEmulatorHost}`
    : "https://firebasestorage.googleapis.com";

  return {
    storagePath,
    downloadToken,
    publicUrl:
      `${storageApiOrigin}/v0/b/${encodeURIComponent(bucket.name)}` +
      `/o/${encodeURIComponent(storagePath)}?alt=media&token=${encodeURIComponent(downloadToken)}`,
  };
}

async function seedSampleProject(database, bucket, project) {
  const projectId = crypto.randomUUID();
  const uploadedStoragePaths = [];

  try {
    const images = [];

    for (const [index, relativeImagePath] of project.imagePaths.entries()) {
      const imageBuffer = await readAssetBuffer(relativeImagePath);
      const uploadedImage = await uploadProjectImage({
        bucket,
        projectId,
        fileName: `${project.slug}-${index + 1}.jpg`,
        buffer: imageBuffer,
      });
      uploadedStoragePaths.push(uploadedImage.storagePath);
      images.push({
        id: crypto.randomUUID(),
        ...uploadedImage,
        altText:
          index === 0
            ? project.coverAltText
            : `${project.title} gallery image ${index + 1}`,
        sortOrder: index,
        isCover: index === 0,
      });
    }

    const now = Timestamp.now();
    const batch = database.batch();
    batch.set(database.collection("projects").doc(projectId), {
      id: projectId,
      slug: project.slug,
      title: project.title,
      published: project.published,
      status: project.status,
      buildTypeSlug: project.buildTypeSlug,
      finishLevelSlug: project.finishLevelSlug,
      squareFootage: project.squareFootage,
      bedrooms: project.bedrooms,
      bathrooms: project.bathrooms,
      location: project.location,
      shortDescription: project.shortDescription,
      fullDescription: project.fullDescription,
      featured: project.featured,
      createdAt: now,
      updatedAt: now,
      images,
    });
    batch.set(database.collection("projectSlugs").doc(project.slug), {
      projectId,
    });
    await batch.commit();
  } catch (error) {
    await removeStorageFiles(bucket, uploadedStoragePaths);
    throw error;
  }
}

async function seedProjects() {
  const { database, bucket } = createFirebaseAdminServices();
  const debugProjectSlugs = [
    "debug-1774661380531",
    "playwright-1774661718607",
  ];

  await deleteProjects(
    database,
    bucket,
    debugProjectSlugs.concat(
      sampleProjects.map((project) => project.slug),
    ),
  );

  for (const project of sampleProjects) {
    await seedSampleProject(database, bucket, project);
  }
}

async function main() {
  requireFirebaseEmulators();

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
