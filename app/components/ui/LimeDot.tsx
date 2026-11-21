/** The lime full-stop at the end of a headline. Decorative, hidden from assistive tech. */
export function LimeDot({ char = '.' }: { /** Punctuation mark to colour, e.g. "?" for the contact headline. */ char?: string }) {
  return (
    <span aria-hidden="true" className="text-lime">
      {char}
    </span>
  )
}
