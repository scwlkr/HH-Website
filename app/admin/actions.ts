"use server";

import { updateTag } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { adminBrand } from "@/lib/admin/branding";
import {
  getProjectSlugAvailability,
  pricingSettingsCacheTag,
  projectCacheTag,
  saveProject,
  upsertPricingSettings,
} from "@/lib/db/operations";
import {
  AdminAuthorizationError,
  clearAdminSession,
  createAdminSession,
  isFirebaseAuthConfigured,
  requireAdminUser,
} from "@/lib/firebase/auth";
import {
  createAdminLoginServerErrorState,
  createPricingServerErrorState,
  createProjectServerErrorState,
  getPricingFormValues,
  getProjectFormValues,
  getProjectUploads,
  mapPricingFieldErrors,
  mapProjectFieldErrors,
  parseExistingProjectImageInputs,
  toPricingWriteInput,
  toProjectWriteInput,
  validatePricingFormValues,
  validateProjectFormValues,
  validateProjectUploads,
} from "@/lib/validation/operations";
import {
  adminLoginActionInitialState,
  pricingActionInitialState,
  projectActionInitialState,
  type AdminLoginActionState,
  type PricingActionState,
  type ProjectActionState,
} from "@/types/operations";

export async function loginAdminAction(
  previousState: AdminLoginActionState = adminLoginActionInitialState,
  formData: FormData,
): Promise<AdminLoginActionState> {
  void previousState;

  if (!isFirebaseAuthConfigured()) {
    return createAdminLoginServerErrorState(
      `Firebase auth is not configured. Add the public Firebase web app settings before using ${adminBrand.name}.`,
    );
  }

  const idToken = formData.get("idToken");

  if (typeof idToken !== "string" || idToken.length === 0) {
    return createAdminLoginServerErrorState(
      `${adminBrand.name} login could not be completed right now.`,
    );
  }

  try {
    await createAdminSession(idToken);
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return createAdminLoginServerErrorState(
        `This account is not authorized to access ${adminBrand.name}.`,
      );
    }

    console.error("Admin login failed", error);
    return createAdminLoginServerErrorState(
      `${adminBrand.name} login could not be completed right now.`,
    );
  }

  return adminLoginActionInitialState;
}

export async function logoutAdminAction() {
  await clearAdminSession();

  redirect("/admin/login?signed_out=1" as Route);
}

export async function saveProjectAction(
  previousState: ProjectActionState = projectActionInitialState,
  formData: FormData,
): Promise<ProjectActionState> {
  void previousState;

  await requireAdminUser();

  const projectId =
    typeof formData.get("projectId") === "string"
      ? String(formData.get("projectId"))
      : undefined;
  const projectRevisionValue = formData.get("projectRevision");
  const expectedRevision =
    typeof projectRevisionValue === "string" &&
    /^\d+$/.test(projectRevisionValue)
      ? Number.parseInt(projectRevisionValue, 10)
      : undefined;

  if (projectId && expectedRevision === undefined) {
    return createProjectServerErrorState(
      "This project version is invalid. Reload the page before saving again.",
    );
  }
  const values = getProjectFormValues(formData);
  const validationResult = validateProjectFormValues(values);

  if (!validationResult.success) {
    const fieldErrors = mapProjectFieldErrors(validationResult.error);
    console.warn("Project validation failed", {
      fieldErrors,
    });

    return {
      status: "field-error",
      message: "Review the project fields before saving.",
      fieldErrors,
      values,
    };
  }

  const uploads = getProjectUploads(formData);
  const uploadValidation = validateProjectUploads({
    ...uploads,
    requireCoverImage: !projectId,
  });

  if (uploadValidation) {
    console.warn("Project upload validation failed", {
      fieldErrors: uploadValidation.fieldErrors,
      hasCoverImage: Boolean(uploads.coverImage),
      galleryImageCount: uploads.galleryImages.length,
    });

    return {
      status: "field-error",
      message: "Review the image uploads before saving.",
      fieldErrors: uploadValidation.fieldErrors,
      values,
    };
  }

  const projectInput = toProjectWriteInput(validationResult.data);
  const slugIsAvailable = await getProjectSlugAvailability(projectInput.slug, projectId);

  if (!slugIsAvailable) {
    return {
      status: "field-error",
      message: "Choose a different slug for this project.",
      fieldErrors: {
        slug: "That slug is already in use by another project.",
      },
      values,
    };
  }

  let savedProject: Awaited<ReturnType<typeof saveProject>>;

  try {
    savedProject = await saveProject({
      project: {
        ...projectInput,
        id: projectId,
      },
      existingImages: parseExistingProjectImageInputs(formData),
      coverImage: uploads.coverImage,
      galleryImages: uploads.galleryImages,
      expectedRevision,
    });
  } catch (error) {
    console.error("Project save failed", error);
    return createProjectServerErrorState(
      error instanceof Error
        ? error.message
        : "The project could not be saved right now.",
      values,
    );
  }

  updateTag(projectCacheTag);
  redirect(`/admin/projects/${savedProject.id}?saved=1` as Route);
}

export async function savePricingSettingsAction(
  previousState: PricingActionState = pricingActionInitialState,
  formData: FormData,
): Promise<PricingActionState> {
  void previousState;

  await requireAdminUser();

  const values = getPricingFormValues(formData);
  const validationResult = validatePricingFormValues(values);

  if (!validationResult.success) {
    const fieldErrors = mapPricingFieldErrors(validationResult.error);
    console.warn("Pricing validation failed", {
      fieldErrors,
    });

    return {
      status: "field-error",
      message: "Review the pricing fields before saving.",
      fieldErrors,
    };
  }

  try {
    await upsertPricingSettings(toPricingWriteInput(validationResult.data));
  } catch (error) {
    console.error("Pricing save failed", error);
    return createPricingServerErrorState(
      "The pricing settings could not be saved right now.",
    );
  }

  updateTag(pricingSettingsCacheTag);
  redirect("/admin/settings/pricing?saved=1" as Route);
}
