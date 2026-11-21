/**
 * Page-local CSS for the About motion. Every "hidden before reveal" state is
 * scoped to `html.js` (set in <head> by index.html), so the prerendered page
 * shows all content without JavaScript. Under reduced motion everything is
 * visible and static straight away.
 */
const css = `
.about-word{display:inline-block;overflow:hidden;vertical-align:top;padding:.06em .05em .14em 0;margin:-.06em -.05em -.14em 0}
.about-word>span{display:inline-block;transition:transform 900ms cubic-bezier(.16,1,.3,1);transition-delay:calc(var(--i,0)*90ms)}
html.js .about-h1:not([data-ready="true"]) .about-word>span{transform:translateY(112%)}
.about-reveal{transition:opacity 800ms cubic-bezier(.16,1,.3,1),transform 800ms cubic-bezier(.16,1,.3,1);transition-delay:var(--d,0ms)}
html.js .about-reveal[data-in="false"]{opacity:0;transform:translateY(24px)}
@media (prefers-reduced-motion: reduce){
.about-word>span,.about-reveal{transition:none}
html.js .about-h1:not([data-ready="true"]) .about-word>span{transform:none}
html.js .about-reveal[data-in="false"]{opacity:1;transform:none}
}
`

export function AboutMotionStyles() {
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
