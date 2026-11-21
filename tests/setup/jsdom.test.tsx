// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'

function Counter() {
  const [n, setN] = useState(0)
  return (
    <button type="button" onClick={() => setN(n + 1)}>
      Count: {n}
    </button>
  )
}

describe('jsdom + Testing Library setup', () => {
  it('renders a component and responds to events', () => {
    render(<Counter />)
    const button = screen.getByRole('button', { name: 'Count: 0' })
    expect(button).toBeTruthy()
    fireEvent.click(button)
    expect(screen.getByRole('button').textContent).toBe('Count: 1')
    cleanup()
    expect(document.body.textContent).toBe('')
  })
})
