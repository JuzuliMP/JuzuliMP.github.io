import { profile } from '../../content/profile'

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-line bg-ink font-mono text-xs uppercase tracking-[0.12em] text-mute">
      <div className="page-container flex flex-wrap items-center justify-between gap-x-8 gap-y-4 pb-7 pt-5 md:py-[26px]">
        <nav aria-label="Social links" className="flex flex-wrap gap-7">
          {profile.socials.map((s) => (
            <a
              key={s.id}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center text-paper no-underline transition-colors duration-150 hover:text-lime"
            >
              {s.label}
            </a>
          ))}
        </nav>
        <span>{profile.location}</span>
        <span>
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {profile.name}
        </span>
      </div>
    </footer>
  )
}
