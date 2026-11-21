import { LimeDot } from '../components/ui/LimeDot'
import { MonoLabel } from '../components/ui/MonoLabel'
import { PillLink } from '../components/ui/PillLink'

export function NotFoundPage() {
  return (
    <section
      aria-labelledby="nf-title"
      className="page-container flex flex-col gap-8 pb-24 pt-14 md:pb-40 md:pt-28"
    >
      <MonoLabel>Error 404</MonoLabel>
      <h1 id="nf-title" className="m-0 text-display">
        Page not found
        <LimeDot />
      </h1>
      <p className="m-0 max-w-[520px] text-body text-soft">
        The page you are looking for does not exist or has moved.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <PillLink href="/" variant="lime" size="lg">
          Back to home
        </PillLink>
        <PillLink href="/work/" variant="outline" size="lg">
          See the work
        </PillLink>
      </div>
    </section>
  )
}
