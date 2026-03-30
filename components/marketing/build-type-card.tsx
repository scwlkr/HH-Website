import Image from "next/image";
import type { BuildType } from "@/types/content";
import { getBuildTypeHref } from "@/lib/content/build-types";
import { resolveContentImage } from "@/lib/content/resolve-content-image";
import { ActionLink } from "@/components/marketing/action-link";
import { CardShell } from "@/components/ui/card-shell";

type BuildTypeCardProps = {
  buildType: BuildType;
  variant?: "preview" | "detail";
};

export function BuildTypeCard({
  buildType,
  variant = "detail",
}: BuildTypeCardProps) {
  const resolvedHeroImage = resolveContentImage(buildType.heroImage);
  const serviceMix = buildType.serviceMix.slice(0, variant === "preview" ? 2 : 3);

  return (
    <CardShell className="h-full">
      <div className="flex h-full flex-col">
        <div className="hh-drafted-media relative aspect-[16/11] overflow-hidden rounded-[calc(var(--hh-radius-panel)-0.2rem)] border border-line bg-surface-raised">
          <Image
            src={resolvedHeroImage.src}
            alt={resolvedHeroImage.alt}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
            unoptimized={resolvedHeroImage.isPlaceholder}
          />
          {resolvedHeroImage.isPlaceholder ? (
            <span className="hh-drafted-chip absolute left-4 top-4 rounded-[var(--hh-radius-pill)] border border-line-strong bg-white/94 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted shadow-[0_12px_18px_-22px_rgba(17,17,15,0.6)]">
              Seed Asset Pending
            </span>
          ) : null}
        </div>
        <p className="mt-5 font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
          Project Category
        </p>
        <div className="mt-3">
          <h3 className="text-2xl sm:text-[1.8rem]">{buildType.title}</h3>
          <p className="mt-3 text-sm leading-7 text-muted">{buildType.tagline}</p>
        </div>
        <p className="mt-5 text-sm leading-7 text-muted">{buildType.cardSummary}</p>
        <div className="mt-6 flex flex-col gap-y-3">
          {serviceMix.map((item) => (
            <span
              key={item}
              className="hh-banner text-muted-strong"
            >
              {item}
            </span>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap gap-3 pt-8">
          <ActionLink
            href={getBuildTypeHref(buildType.slug)}
            label="View Category Details"
            variant="secondary"
          />
        </div>
      </div>
    </CardShell>
  );
}
