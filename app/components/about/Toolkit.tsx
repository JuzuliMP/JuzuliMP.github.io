import type { SkillGroup } from '../../content/types'
import { MonoLabel } from '../ui/MonoLabel'

/** Four toolkit groups: a lime mono title over a dot-separated list. */
export function Toolkit({ groups }: { groups: readonly SkillGroup[] }) {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
      {groups.map((group) => (
        <div key={group.title} className="flex min-w-0 flex-col gap-3.5 border-t border-line pt-4">
          <MonoLabel as="h3" tone="lime" className="font-medium">
            {group.title}
          </MonoLabel>
          <ul className="m-0 list-none p-0 text-xl leading-[1.6]">
            {group.items.map((item, i) => (
              <li key={item} className="inline">
                {item}
                {i < group.items.length - 1 ? <span aria-hidden="true"> · </span> : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
