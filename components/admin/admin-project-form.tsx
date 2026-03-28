"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils/slugify";
import {
  emptyProjectFormValues,
  projectActionInitialState,
  type ProjectDetail,
  type ProjectFormValues,
} from "@/types/operations";
import { saveProjectAction } from "@/app/admin/actions";

type Option = {
  label: string;
  value: string;
};

type AdminProjectFormProps = {
  project: ProjectDetail | null;
  buildTypeOptions: Option[];
  finishLevelOptions: Option[];
};

const statusOptions: Option[] = [
  { label: "For Sale", value: "for-sale" },
  { label: "Sold", value: "sold" },
];

function createProjectFormValues(
  project: ProjectDetail | null,
  buildTypeOptions: Option[],
  finishLevelOptions: Option[],
): ProjectFormValues {
  return {
    ...emptyProjectFormValues,
    title: project?.title ?? "",
    slug: project?.slug ?? "",
    status: project?.status ?? "for-sale",
    buildTypeSlug:
      project?.buildTypeSlug ??
      (buildTypeOptions[0]?.value as ProjectFormValues["buildTypeSlug"]) ??
      "",
    finishLevelSlug:
      project?.finishLevelSlug ??
      (finishLevelOptions[0]?.value as ProjectFormValues["finishLevelSlug"]) ??
      "",
    squareFootage: project ? project.squareFootage.toString() : "",
    bedrooms: project ? project.bedrooms.toString() : "",
    bathrooms: project ? project.bathrooms.toString() : "",
    location: project?.location ?? "",
    shortDescription: project?.shortDescription ?? "",
    fullDescription: project?.fullDescription ?? "",
    featured: project?.featured ?? false,
    coverAltText: project?.coverImage?.altText ?? "",
  };
}

export function AdminProjectForm({
  project,
  buildTypeOptions,
  finishLevelOptions,
}: AdminProjectFormProps) {
  const initialFormValues = useMemo(
    () => createProjectFormValues(project, buildTypeOptions, finishLevelOptions),
    [buildTypeOptions, finishLevelOptions, project],
  );
  const [state, formAction, pending] = useActionState(
    saveProjectAction,
    projectActionInitialState,
  );
  const [formValues, setFormValues] = useState(initialFormValues);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(project));
  const orderedImages = useMemo(
    () =>
      [...(project?.images ?? [])].sort((leftImage, rightImage) => {
        if (leftImage.isCover !== rightImage.isCover) {
          return leftImage.isCover ? -1 : 1;
        }

        return leftImage.sortOrder - rightImage.sortOrder;
      }),
    [project],
  );

  useEffect(() => {
    const nextValues = state.values ?? initialFormValues;
    setFormValues(nextValues);
    setSlugManuallyEdited(
      Boolean(project) || nextValues.slug !== slugify(nextValues.title),
    );
  }, [initialFormValues, project, state.values]);

  return (
    <form action={formAction} className="space-y-8" encType="multipart/form-data">
      {project ? <input type="hidden" name="projectId" value={project.id} /> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Input
          name="title"
          label="Project Title"
          value={formValues.title}
          onChange={(event) => {
            const nextTitle = event.currentTarget.value;
            setFormValues((currentValues) => ({
              ...currentValues,
              title: nextTitle,
              slug: slugManuallyEdited ? currentValues.slug : slugify(nextTitle),
            }));
          }}
          className="rounded-[var(--hh-radius-tight)]"
          error={state.fieldErrors.title}
          required
        />

        <Input
          name="slug"
          label="Slug"
          value={formValues.slug}
          onChange={(event) => {
            const nextSlug = slugify(event.currentTarget.value);
            setSlugManuallyEdited(true);
            setFormValues((currentValues) => ({
              ...currentValues,
              slug: nextSlug,
            }));
          }}
          className="rounded-[var(--hh-radius-tight)]"
          helperText="Public route: /projects/[slug]"
          error={state.fieldErrors.slug}
          required
        />

        <Select
          name="status"
          label="Status"
          options={statusOptions}
          value={formValues.status}
          onChange={(event) => {
            const nextStatus = event.currentTarget.value as ProjectFormValues["status"];
            setFormValues((currentValues) => ({
              ...currentValues,
              status: nextStatus,
            }));
          }}
          className="rounded-[var(--hh-radius-tight)]"
          error={state.fieldErrors.status}
        />

        <div className="flex items-end">
          <label className="flex items-center gap-3 rounded-[var(--hh-radius-tight)] border border-line-strong bg-surface-raised px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="featured"
              checked={formValues.featured}
              onChange={(event) => {
                const nextFeatured = event.currentTarget.checked;
                setFormValues((currentValues) => ({
                  ...currentValues,
                  featured: nextFeatured,
                }));
              }}
            />
            <span>Pin this home to the top of the public projects list</span>
          </label>
        </div>

        <Select
          name="buildTypeSlug"
          label="Build Type"
          options={buildTypeOptions}
          value={formValues.buildTypeSlug}
          onChange={(event) => {
            const nextBuildTypeSlug =
              event.currentTarget.value as ProjectFormValues["buildTypeSlug"];
            setFormValues((currentValues) => ({
              ...currentValues,
              buildTypeSlug: nextBuildTypeSlug,
            }));
          }}
          className="rounded-[var(--hh-radius-tight)]"
          error={state.fieldErrors.buildTypeSlug}
        />

        <Select
          name="finishLevelSlug"
          label="Finish Level"
          options={finishLevelOptions}
          value={formValues.finishLevelSlug}
          onChange={(event) => {
            const nextFinishLevelSlug =
              event.currentTarget.value as ProjectFormValues["finishLevelSlug"];
            setFormValues((currentValues) => ({
              ...currentValues,
              finishLevelSlug: nextFinishLevelSlug,
            }));
          }}
          className="rounded-[var(--hh-radius-tight)]"
          error={state.fieldErrors.finishLevelSlug}
        />

        <Input
          name="squareFootage"
          label="Square Footage"
          value={formValues.squareFootage}
          onChange={(event) => {
            const nextSquareFootage = event.currentTarget.value;
            setFormValues((currentValues) => ({
              ...currentValues,
              squareFootage: nextSquareFootage,
            }));
          }}
          className="rounded-[var(--hh-radius-tight)]"
          error={state.fieldErrors.squareFootage}
          required
        />

        <Input
          name="location"
          label="Location"
          value={formValues.location}
          onChange={(event) => {
            const nextLocation = event.currentTarget.value;
            setFormValues((currentValues) => ({
              ...currentValues,
              location: nextLocation,
            }));
          }}
          className="rounded-[var(--hh-radius-tight)]"
          error={state.fieldErrors.location}
          required
        />

        <Input
          name="bedrooms"
          label="Bedrooms"
          value={formValues.bedrooms}
          onChange={(event) => {
            const nextBedrooms = event.currentTarget.value;
            setFormValues((currentValues) => ({
              ...currentValues,
              bedrooms: nextBedrooms,
            }));
          }}
          className="rounded-[var(--hh-radius-tight)]"
          error={state.fieldErrors.bedrooms}
          required
        />

        <Input
          name="bathrooms"
          label="Bathrooms"
          value={formValues.bathrooms}
          onChange={(event) => {
            const nextBathrooms = event.currentTarget.value;
            setFormValues((currentValues) => ({
              ...currentValues,
              bathrooms: nextBathrooms,
            }));
          }}
          className="rounded-[var(--hh-radius-tight)]"
          error={state.fieldErrors.bathrooms}
          required
        />
      </div>

      <Textarea
        name="shortDescription"
        label="Short Description"
        value={formValues.shortDescription}
        onChange={(event) => {
          const nextShortDescription = event.currentTarget.value;
          setFormValues((currentValues) => ({
            ...currentValues,
            shortDescription: nextShortDescription,
          }));
        }}
        className="rounded-[var(--hh-radius-tight)]"
        helperText="Shown on the public projects grid."
        error={state.fieldErrors.shortDescription}
        required
      />

      <Textarea
        name="fullDescription"
        label="Full Description"
        value={formValues.fullDescription}
        onChange={(event) => {
          const nextFullDescription = event.currentTarget.value;
          setFormValues((currentValues) => ({
            ...currentValues,
            fullDescription: nextFullDescription,
          }));
        }}
        className="rounded-[var(--hh-radius-tight)]"
        helperText="Shown on the public project detail page."
        error={state.fieldErrors.fullDescription}
        required
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Input
          name="coverImage"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          label={project ? "Replace Cover Image" : "Cover Image"}
          className="rounded-[var(--hh-radius-tight)] file:mr-3 file:rounded-[var(--hh-radius-tight)] file:border-0 file:bg-accent file:px-3 file:py-2 file:font-mono file:text-[0.68rem] file:uppercase file:tracking-[0.18em] file:text-[#f9f6ef]"
          helperText={
            project
              ? "Optional. JPG, PNG, WebP, or AVIF up to 10 MB. Uploading a new cover image keeps older images unless removed below."
              : "Required for new projects. JPG, PNG, WebP, or AVIF up to 10 MB."
          }
          error={state.fieldErrors.coverImage}
        />

        <Input
          name="galleryImages"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          label="Add Gallery Images"
          className="rounded-[var(--hh-radius-tight)] file:mr-3 file:rounded-[var(--hh-radius-tight)] file:border-0 file:bg-surface-raised file:px-3 file:py-2 file:font-mono file:text-[0.68rem] file:uppercase file:tracking-[0.18em]"
          helperText="Optional. Each image must be under 10 MB, and each save can upload up to 48 MB total."
          error={state.fieldErrors.galleryImages}
        />
      </div>

      <Input
        name="coverAltText"
        label="Cover Alt Text"
        value={formValues.coverAltText}
        onChange={(event) => {
          const nextCoverAltText = event.currentTarget.value;
          setFormValues((currentValues) => ({
            ...currentValues,
            coverAltText: nextCoverAltText,
          }));
        }}
        className="rounded-[var(--hh-radius-tight)]"
        helperText="Optional override for the uploaded cover image."
        error={state.fieldErrors.coverAltText}
      />

      {orderedImages.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl">Existing Images</h2>
              <p className="mt-1 text-sm text-muted">
                Update alt text and order, choose the cover, or remove images.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {orderedImages.map((image) => (
              <div
                key={image.id}
                className="grid gap-4 rounded-[var(--hh-radius-tight)] border border-line bg-surface-raised p-4 lg:grid-cols-[9rem_minmax(0,1fr)_7rem_7rem]"
              >
                <div className="overflow-hidden rounded-[var(--hh-radius-tight)] border border-line bg-background">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={image.publicUrl}
                      alt={image.altText || project?.title || "Project image"}
                      fill
                      sizes="144px"
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                      {image.isCover ? "Current cover image" : "Gallery image"}
                    </span>
                  </div>

                  <Input
                    name={`existingImageAltText:${image.id}`}
                    label="Alt Text"
                    defaultValue={image.altText}
                    className="rounded-[var(--hh-radius-tight)]"
                  />
                </div>

                <Input
                  name={`existingImageSortOrder:${image.id}`}
                  label="Sort Order"
                  defaultValue={image.sortOrder.toString()}
                  className="rounded-[var(--hh-radius-tight)]"
                />

                <div className="space-y-3">
                  <label className="flex items-center gap-2 rounded-[var(--hh-radius-tight)] border border-line-strong bg-background px-3 py-3 text-sm">
                    <input
                      type="radio"
                      name="coverImageId"
                      value={image.id}
                      defaultChecked={image.isCover}
                    />
                    <span>Cover</span>
                  </label>

                  <label className="flex items-center gap-2 rounded-[var(--hh-radius-tight)] border border-line-strong bg-background px-3 py-3 text-sm">
                    <input type="checkbox" name={`existingImageRemove:${image.id}`} />
                    <span>Remove</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {state.message ? (
        <p className="text-sm text-accent-strong">{state.message}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          className="rounded-[var(--hh-radius-tight)]"
          disabled={pending}
        >
          {pending
            ? project
              ? "Saving..."
              : "Creating..."
            : project
              ? "Save Project"
              : "Create Project"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="rounded-[var(--hh-radius-tight)]"
          onClick={() => {
            setFormValues((currentValues) => ({
              ...currentValues,
              slug: slugify(currentValues.title),
            }));
            setSlugManuallyEdited(false);
          }}
        >
          Refresh Slug
        </Button>
      </div>
    </form>
  );
}
