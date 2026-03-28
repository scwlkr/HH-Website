"use server";

import { updateTag } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, isSupabaseAuthConfigured } from "@/lib/supabase/server";
import { isAuthorizedAdminUser } from "@/lib/supabase/admin-access";
import { requireAdminUser } from "@/lib/supabase/auth";
import {
  getProjectSlugAvailability,
  pricingSettingsCacheTag,
  projectCacheTag,
  saveProject,
  upsertPricingSettings,
} from "@/lib/db/operations";
import {
  createAdminLoginServerErrorState,
  createPricingServerErrorState,
  createProjectServerErrorState,
  getAdminLoginValues,
  getPricingFormValues,
  getProjectFormValues,
  getProjectUploads,
  mapAdminLoginFieldErrors,
  mapPricingFieldErrors,
  mapProjectFieldErrors,
  parseExistingProjectImageInputs,
  toPricingWriteInput,
  toProjectWriteInput,
  validateAdminLoginValues,
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

function normalizeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/admin")) {
    return "/admin/projects" as Route;
  }

  return value as Route;
}

export async function loginAdminAction(
  previousState: AdminLoginActionState = adminLoginActionInitialState,
  formData: FormData,
): Promise<AdminLoginActionState> {
  void previousState;

  if (!isSupabaseAuthConfigured()) {
    return createAdminLoginServerErrorState(
      "Supabase auth is not configured. Add the public Supabase URL and anon key before using the portal.",
    );
  }

  const values = getAdminLoginValues(formData);
  const validationResult = validateAdminLoginValues(values);

  if (!validationResult.success) {
    const fieldErrors = mapAdminLoginFieldErrors(validationResult.error);
    console.warn("Admin login validation failed", {
      fieldErrors,
    });

    return {
      status: "field-error",
      message: "Review the highlighted fields and try again.",
      fieldErrors,
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.signInWithPassword(validationResult.data);

    if (error) {
      return createAdminLoginServerErrorState(error.message);
    }

    if (!isAuthorizedAdminUser(user)) {
      await supabase.auth.signOut();
      return createAdminLoginServerErrorState(
        "This account is not authorized to access the operations portal.",
      );
    }
  } catch (error) {
    console.error("Admin login failed", error);
    return createAdminLoginServerErrorState(
      "The portal login could not be completed right now.",
    );
  }

  redirect(normalizeNextPath(formData.get("next")));
}

export async function logoutAdminAction() {
  if (isSupabaseAuthConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Admin logout failed", error);
    }
  }

  redirect("/admin/login" as Route);
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
