const phaseOneDeliverables = [
  "Next.js App Router with TypeScript and Tailwind CSS",
  "Architecture-aligned route, component, library, and asset folders",
  "Environment scaffolding for site metadata and Supabase persistence",
];

const upcomingPhases = [
  "Design system and shared layout primitives",
  "Typed content models for finish levels, build types, and FAQ entries",
  "Marketing pages and the guided project inquiry flow",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[var(--hh-container-max)] flex-col gap-12 px-6 py-6 sm:px-10 sm:py-8 lg:px-16 lg:py-10">
        <header className="flex flex-col gap-6 border-y border-line-strong py-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.36em] text-accent">
              Howeth &amp; Harp
            </p>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                Phase 1 foundation is in place for the HH website build.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
                The project is now scaffolded as a server-rendered Next.js
                application with the folder structure and baseline styling
                needed to move into the design system and content-model phases.
              </p>
            </div>
          </div>
          <p className="max-w-sm border-l border-line pl-5 font-mono text-xs uppercase tracking-[0.22em] text-muted">
            Precision first. Restraint first. Structure before polish.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
          <article className="rounded-[var(--hh-radius-panel)] border border-line bg-surface p-6 sm:p-8">
            <div className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted">
                  Current Scope
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                  Phase 1 deliverables
                </h2>
              </div>
              <span className="rounded-full border border-line-strong px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-accent">
                Foundation
              </span>
            </div>

            <ul className="space-y-4">
              {phaseOneDeliverables.map((item, index) => (
                <li
                  key={item}
                  className="flex gap-4 border-b border-dashed border-line pb-4 last:border-b-0 last:pb-0"
                >
                  <span className="font-mono text-sm text-muted">
                    0{index + 1}
                  </span>
                  <p className="text-base leading-7">{item}</p>
                </li>
              ))}
            </ul>
          </article>

          <aside className="rounded-[var(--hh-radius-panel)] border border-line bg-transparent p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted">
              Next Up
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              Planned follow-on work
            </h2>
            <ul className="mt-8 space-y-4">
              {upcomingPhases.map((item) => (
                <li
                  key={item}
                  className="border-l border-line pl-4 text-sm leading-6 text-muted"
                >
                  {item}
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </div>
    </main>
  );
}
