import { projects, workPage } from '../content/projects'
import { WorkList } from '../components/work/WorkList'

export function WorkPage() {
  return (
    <div className="page-container pb-[72px] pt-12 md:pb-[120px] md:pt-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-16">
        <h1 className="m-0 flex items-start gap-3.5 text-display leading-[0.92] tracking-[-0.055em]">
          {workPage.title}
          <span className="mt-3 font-mono text-sm font-medium leading-none tracking-normal text-lime">
            {workPage.count}
          </span>
        </h1>
        <p className="m-0 mb-2 max-w-[360px] text-[17px] leading-[1.6] text-soft md:text-lg">
          {workPage.intro}
        </p>
      </div>

      <WorkList projects={projects} hoverChip={workPage.hoverChip} />
    </div>
  )
}
