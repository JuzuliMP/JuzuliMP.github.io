// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ArrowLink } from '../../app/components/ui/ArrowLink'
import { CtaSection } from '../../app/components/ui/CtaSection'
import { LimeDot } from '../../app/components/ui/LimeDot'
import { MonoLabel } from '../../app/components/ui/MonoLabel'
import { PillLink } from '../../app/components/ui/PillLink'
import { SectionHeading } from '../../app/components/ui/SectionHeading'
import { Tag, TagList } from '../../app/components/ui/Tag'
import { cx } from '../../app/lib/cx'
import { externalProps, isExternal, stripArrow } from '../../app/lib/links'

afterEach(cleanup)

describe('PillLink', () => {
  it('opens external links in a new tab with rel and shows the arrow', () => {
    render(<PillLink href="https://example.com/">GitHub</PillLink>)
    const link = screen.getByRole('link', { name: 'GitHub' })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    const arrow = link.querySelector('[aria-hidden="true"]')
    expect(arrow?.textContent).toBe('↗')
  })

  it('keeps internal and mailto links in the same tab with no arrow', () => {
    render(
      <>
        <PillLink href="/work/">Work</PillLink>
        <PillLink href="mailto:a@b.co">Mail</PillLink>
      </>,
    )
    for (const name of ['Work', 'Mail']) {
      const link = screen.getByRole('link', { name })
      expect(link.hasAttribute('target')).toBe(false)
      expect(link.hasAttribute('rel')).toBe(false)
      expect(link.textContent).not.toMatch(/[↗→]/)
    }
  })

  it('does not double an arrow that is already in the label', () => {
    render(<PillLink href="https://pub.dev/">View on pub.dev ↗</PillLink>)
    expect(screen.getByRole('link').textContent).toBe('View on pub.dev↗')
  })

  it('applies the variant classes', () => {
    render(
      <>
        <PillLink href="/a/" variant="lime">
          Lime
        </PillLink>
        <PillLink href="/b/">Outline</PillLink>
      </>,
    )
    expect(screen.getByRole('link', { name: 'Lime' }).className).toContain('bg-lime')
    const outline = screen.getByRole('link', { name: 'Outline' })
    expect(outline.className).toContain('border-paper')
    expect(outline.className).toContain('hover:bg-lime')
  })
})

describe('ArrowLink', () => {
  it('adds a forward arrow, an external arrow and a back arrow', () => {
    render(
      <>
        <ArrowLink href="/work/">All work (05) →</ArrowLink>
        <ArrowLink href="https://juzuli.medium.com/">All articles</ArrowLink>
        <ArrowLink href="/work/" direction="back">
          All work
        </ArrowLink>
      </>,
    )
    const [internal, external, back] = screen.getAllByRole('link')
    expect(internal.textContent).toBe('All work (05)→')
    expect(internal.hasAttribute('target')).toBe(false)
    expect(external.textContent).toBe('All articles↗')
    expect(external.getAttribute('target')).toBe('_blank')
    expect(external.getAttribute('rel')).toBe('noopener noreferrer')
    expect(back.textContent).toBe('←All work')
  })
})

describe('Tag, MonoLabel, SectionHeading, LimeDot', () => {
  it('renders Tag and TagList children', () => {
    render(
      <>
        <Tag>Flutter</Tag>
        <TagList tags={['Dart', 'BLoC']} />
      </>,
    )
    expect(screen.getByText('Flutter')).toBeTruthy()
    const items = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(items).toEqual(['Dart', 'BLoC'])
  })

  it('renders MonoLabel as the requested element with its tone', () => {
    render(
      <MonoLabel as="span" tone="lime">
        Flutter package
      </MonoLabel>,
    )
    const el = screen.getByText('Flutter package')
    expect(el.tagName).toBe('SPAN')
    expect(el.className).toContain('mono-label')
    expect(el.className).toContain('text-lime')
  })

  it('renders SectionHeading as a heading with an optional count', () => {
    render(
      <>
        <SectionHeading count="05">Selected apps</SectionHeading>
        <SectionHeading as="h3" tone="mute">
          Writing
        </SectionHeading>
      </>,
    )
    const h2 = screen.getByRole('heading', { level: 2 })
    expect(h2.textContent).toBe('Selected apps05')
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Writing')
  })

  it('hides LimeDot from assistive tech and accepts another mark', () => {
    const { container } = render(
      <h1>
        Hello
        <LimeDot />
        <LimeDot char="?" />
      </h1>,
    )
    const marks = container.querySelectorAll('span')
    expect(marks).toHaveLength(2)
    expect(marks[0].getAttribute('aria-hidden')).toBe('true')
    expect(marks[1].textContent).toBe('?')
    expect(screen.getByRole('heading').textContent).toBe('Hello.?')
  })
})

describe('CtaSection', () => {
  it('renders the headline with a lime mark and both links', () => {
    render(
      <CtaSection
        eyebrow="Contact"
        title="Have an app in mind"
        mark="?"
        primary={{ label: "Let's talk", href: 'mailto:a@b.co' }}
        secondary={{ label: 'Or find me on LinkedIn ↗', href: 'https://linkedin.com/in/juzuli' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Have an app in mind?')
    expect(screen.getByRole('link', { name: "Let's talk" }).getAttribute('href')).toBe('mailto:a@b.co')
    const linkedin = screen.getByRole('link', { name: /LinkedIn/ })
    expect(linkedin.getAttribute('target')).toBe('_blank')
    expect(linkedin.textContent).toBe('Or find me on LinkedIn↗')
  })
})

describe('link and class helpers', () => {
  it('isExternal / externalProps only flag absolute http(s) URLs', () => {
    expect(isExternal('https://x.com/Juzuli_M_P')).toBe(true)
    expect(isExternal('http://example.com')).toBe(true)
    for (const href of ['/work/', 'mailto:a@b.co', '#contact', 'tel:+1']) {
      expect(isExternal(href)).toBe(false)
      expect(externalProps(href)).toEqual({})
    }
    expect(externalProps('https://x.com')).toEqual({ target: '_blank', rel: 'noopener noreferrer' })
  })

  it('stripArrow removes one leading or trailing arrow from strings only', () => {
    expect(stripArrow('GitHub ↗')).toBe('GitHub')
    expect(stripArrow('See the work →')).toBe('See the work')
    expect(stripArrow('← All work')).toBe('All work')
    expect(stripArrow('Plain')).toBe('Plain')
    const node = <b>x</b>
    expect(stripArrow(node)).toBe(node)
  })

  it('cx joins truthy class names', () => {
    expect(cx('a', false, null, undefined, 'b')).toBe('a b')
    expect(cx()).toBe('')
  })
})
