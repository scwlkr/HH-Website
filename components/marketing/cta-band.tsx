import { CardShell } from "@/components/ui/card-shell";
import { ActionLink } from "@/components/marketing/action-link";

type BandAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  trackingLocation?: string;
  trackingContext?: string;
};

type CtaBandProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: BandAction;
  secondaryAction?: BandAction;
  notes?: ReadonlyArray<string>;
};

export function CtaBand({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  notes,
}: CtaBandProps) {
  return (
    <CardShell tone="accent" className="px-6 py-7 sm:px-8 sm:py-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.55fr)] lg:gap-10">
        <div>
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-accent">
            {eyebrow}
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl sm:text-4xl">{title}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ActionLink
              href={primaryAction.href}
              label={primaryAction.label}
              variant={primaryAction.variant}
              trackingLocation={primaryAction.trackingLocation}
              trackingContext={primaryAction.trackingContext}
            />
            {secondaryAction ? (
              <ActionLink
                href={secondaryAction.href}
                label={secondaryAction.label}
                variant={secondaryAction.variant ?? "secondary"}
                trackingLocation={secondaryAction.trackingLocation}
                trackingContext={secondaryAction.trackingContext}
              />
            ) : null}
          </div>
        </div>

        {notes?.length ? (
          <div className="border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-accent">
              Why This Route
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-muted">
              {notes.map((note) => (
                <li
                  key={note}
                  className="border-b border-line pb-3 last:border-b-0 last:pb-0"
                >
                  {note}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </CardShell>
  );
}
