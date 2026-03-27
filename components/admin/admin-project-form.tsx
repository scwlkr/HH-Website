"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils/slugify";
import {
  projectActionInitialState,
  type ProjectDetail,
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

export function AdminProjectForm({
  project,
  buildTypeOptions,
  finishLevelOptions,
}: AdminProjectFormProps) {
  const [state, formAction, pending] = useActionState(
    saveProjectAction,
    projectActionInitialState,
  );
  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
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

  return (
    <form action={formAction} className="space-y-8" encType="multipart/form-data">
      {project ? <input type="hidden" name="projectId" value={project.id} /> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Input
          name="title"
          label="Project Title"
          value={title}
          onChange={(event) => {
            const nextTitle = event.currentTarget.value;
            setTitle(nextTitle);

            if (!slugManuallyEdited) {
              setSlug(slugify(nextTitle));
            }
          }}
          className="rounded-[var(--hh-radius-tight)]"
          error={state.fieldErrors.title}
          required
        />

        <Input
          name="slug"
          label="Slug"
          value={slug}
          onChange={(event) => {
            setSlugManuallyEdited(true);
            setSlug(slugify(event.currentTarget.value));
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
          defaultValue={project?.status ?? "for-sale"}
          className="rounded-[var(--hh-radius-tight)]"
          error={state.fieldErrors.status}
        />

        <div className="flex items-end">
          <label className="flex items-center gap-3 rounded-[var(--hh-radius-tight)] border border-line-strong bg-surface-raised px-4 py-3 text-sm">
            <input type="checkbox" name="featured" defaultChecked={project?.featured} />
            <span>Pin this home to the top of the public projects list</span>
          </label>
        </div>

        <Select
          name="buildTypeSlug"
          label="Build Type"
          options={buildTypeOptions}
          defaultValue={project?.buildTypeSlug ?? buildTypeOptions[0]?.value}
          className="rounded-[var(--hh-radius-tight)]"
          error={state.fieldErrors.buildTypeSlug}
        />

        <Select
          name="finishLevelSlug"
          label="Finish Level"
          options={finishLevelOptions}
          defaultValue={project?.finishLevelSlug ?? finishLevelOptions[0]?.value}
          className="rounded-[var(--hh-radius-tight)]"
          error={state.fieldErrors.finishLevelSlug}
        />

        <Input
          name="squareFootage"
          label="Square Footage"
          defaultValue={project?.squareFootage.toString() ?? ""}
          className="rounded-[var(--hh-radius-tight)]"
          error={state.fieldErrors.squareFootage}
          required
        />

        <Input
          name="location"
          label="Location"
          defaultValue={project?.location ?? ""}
          className="rounded-[var(--hh-radius-tight)]"
          error={state.fieldErrors.location}
          required
        />

        <Input
          name="bedrooms"
          label="Bedrooms"
          defaultValue={project?.bedrooms.toString() ?? ""}
          className="rounded-[var(--hh-radius-tight)]"
          error={state.fieldErrors.bedrooms}
          required
        />

        <Input
          name="bathrooms"
          label="Bathrooms"
          defaultValue={project?.bathrooms.toString() ?? ""}
          className="rounded-[var(--hh-radius-tight)]"
          error={state.fieldErrors.bathrooms}
          required
        />
      </div>

      <Textarea
        name="shortDescription"
        label="Short Description"
        defaultValue={project?.shortDescription ?? ""}
        className="rounded-[var(--hh-radius-tight)]"
        helperText="Shown on the public projects grid."
        error={state.fieldErrors.shortDescription}
        required
      />

      <Textarea
        name="fullDescription"
        label="Full Description"
        defaultValue={project?.fullDescription ?? ""}
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
              ? "Optional. Uploading a new cover image keeps older images unless removed below."
              : "Required for new projects."
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
          error={state.fieldErrors.galleryImages}
        />
      </div>

      <Input
        name="coverAltText"
        label="Cover Alt Text"
        defaultValue={project?.coverImage?.altText ?? ""}
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
            if (!slugManuallyEdited) {
              setSlug(slugify(title));
            }
          }}
        >
          Refresh Slug
        </Button>
      </div>
    </form>
  );
}
