export type ExternalLink = {
  label: string
  href: string
}

export type ImageAsset = {
  src: string
  alt: string
  /** Intrinsic pixel size of the file; set on content images so `<img>` can reserve space (no layout shift). */
  width?: number
  height?: number
}

export type Social = ExternalLink & {
  /** Short key used for icons / analytics later. */
  id: 'github' | 'linkedin' | 'x' | 'instagram'
}

export type Profile = {
  name: string
  shortName: string
  title: string
  location: string
  email: string
  /** `mailto:` link used by every "Let's talk" button. */
  emailHref: string
  socials: Social[]
  /** Portrait used on the About page and in structured data. */
  portrait: ImageAsset
}

export const PROJECT_SLUGS = [
  'ychat',
  'superr-parents',
  'superr-child',
  'ablemart',
  'topsite',
] as const

export type ProjectSlug = (typeof PROJECT_SLUGS)[number]

export type ProjectFacts = {
  role: string
  company: string
  year: string
  platforms: string
}

export type ProjectSection = {
  title: string
  body: string
}

export type ProjectScreenshot = ImageAsset & {
  caption: string
}

export type ProjectCover = ImageAsset & {
  /** Alt text used where the cover is shown as a list thumbnail (Home, Work). */
  listAlt: string
}

export type Project = {
  slug: ProjectSlug
  /** Zero-padded list number, "001" … "005". */
  number: string
  name: string
  /** Short domain label shown above the title, e.g. "Social · Real-time". */
  domain: string
  /** Mono line under the title in the Work list. */
  tagline: string
  /** The sentence under the title on the project page. */
  summary: string
  /** One-sentence meta description for search and link previews. */
  metaDescription: string
  facts: ProjectFacts
  /** Optional: Topsite has no stack tags. */
  stack?: string[]
  link: ExternalLink
  cover: ProjectCover
  sections: ProjectSection[]
  screenshots: ProjectScreenshot[]
  nextSlug: ProjectSlug
}

export type Experience = {
  period: string
  /** True for the role held today (filled dot). */
  current: boolean
  role: string
  company: string
  companyUrl: string
  location: string
  description: string
}

export type SkillGroup = {
  title: string
  items: string[]
}

export type AboutContent = {
  headline: [string, string]
  /** Mark rendered in lime in front of the second headline line. */
  headlineMark: string
  note: string
  label: string
  lead: string
  bio: string[]
  experience: {
    heading: string
    range: string
  }
  toolkit: {
    heading: string
  }
  cta: {
    eyebrow: string
    title: string
    mark: string
    button: string
    secondary: ExternalLink
  }
}

export type ParticleShape = 'field' | 'phone' | 'code' | 'globe'

export type Chapter = {
  number: string
  word: string
  lead: string
  body: string
  tags: string[]
  shape: Exclude<ParticleShape, 'field'>
}

export type Article = {
  date: string
  title: string
  href: string
}

export type HomeContent = {
  hero: {
    eyebrow: string
    nameLines: [string, string]
    bio: string
    scrollCue: { label: string; counter: string }
  }
  chapters: Chapter[]
  selectedApps: {
    heading: string
    link: ExternalLink
    slugs: ProjectSlug[]
  }
  openSource: {
    heading: string
    eyebrow: string
    package: {
      label: string
      name: string
      description: string
      links: ExternalLink[]
    }
  }
  writing: {
    heading: string
    link: ExternalLink
    articles: Article[]
  }
  cta: {
    eyebrow: string
    title: string
    mark: string
    button: string
    secondary: ExternalLink
  }
}

export type WorkPageContent = {
  title: string
  count: string
  intro: string
  hoverChip: string
}
