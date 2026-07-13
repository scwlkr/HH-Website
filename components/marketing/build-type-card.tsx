import Image from "next/image";
import type { BuildType } from "@/types/content";
import { getBuildTypeHref } from "@/lib/content/build-types";
import { resolveContentImage } from "@/lib/content/resolve-content-image";
import { ActionLink } from "@/components/marketing/action-link";

type BuildTypeCardProps = {
  buildType: BuildType;
  variant?: "preview" | "detail";
  index: number;
};

export function BuildTypeCard({
  buildType,
  variant = "detail",
  index,
}: BuildTypeCardProps) {
  const resolvedHeroImage = resolveContentImage(buildType.heroImage);
  const serviceMix = buildType.serviceMix.slice(0, variant === "preview" ? 2 : 3);

  return (
    <article className="grid gap-6 border-t border-line-strong py-7 md:grid-cols-[minmax(15rem,0.62fr)_minmax(0,1.38fr)] md:gap-8 lg:grid-cols-[minmax(17rem,0.62fr)_minmax(15rem,0.58fr)_minmax(0,0.8fr)] lg:gap-10">
        <div className="hh-drafted-media relative aspect-[16/11] overflow-hidden border border-line bg-surface-raised">
          <Image
            src={resolvedHeroImage.src}
            alt={resolvedHeroImage.alt}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
            unoptimized={resolvedHeroImage.isPlaceholder}
          />
          {resolvedHeroImage.isPlaceholder ? (
            <span className="absolute bottom-4 left-4 bg-white/90 px-2 py-1 font-mono text-[0.64rem] uppercase tracking-[0.18em] text-muted">
              Reference Study
            </span>
          ) : null}
        </div>

        <div>
          <div className="flex items-center gap-4 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-accent">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span>Project Category</span>
          </div>
          <h3 className="mt-4 text-2xl sm:text-[1.8rem]">{buildType.title}</h3>
          <p className="mt-3 text-sm leading-7 text-muted">{buildType.tagline}</p>
          <p className="mt-5 text-sm leading-7 text-muted">{buildType.cardSummary}</p>
          <div className="mt-7">
          <ActionLink
            href={getBuildTypeHref(buildType.slug)}
            label="View Category Details"
            variant="secondary"
          />
          </div>
        </div>

        <div className="border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-accent">
            Service Mix
          </p>
          <ul className="mt-4 border-t border-line text-sm leading-7 text-muted-strong">
            {serviceMix.map((item) => (
              <li key={item} className="border-b border-line py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>
    </article>
  );
}
