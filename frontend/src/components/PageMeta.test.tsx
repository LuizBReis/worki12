import { describe, it, expect, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import PageMeta from './PageMeta'

afterEach(() => {
  document.title = ''
})

describe('PageMeta', () => {
  it('renderiza title com sufixo " — Worki" quando não incluído', () => {
    render(<PageMeta title="Entrar" />)
    expect(document.title).toBe('Entrar — Worki')
  })

  it('não duplica sufixo quando title já contém Worki', () => {
    render(<PageMeta title="Worki — Marketplace" />)
    expect(document.title).toBe('Worki — Marketplace')
  })

  it('renderiza meta description quando prop description fornecida', () => {
    render(<PageMeta title="Entrar" description="Entre na sua conta Worki." />)
    const metaDesc = document.querySelector('meta[name="description"]')
    expect(metaDesc).not.toBeNull()
    expect(metaDesc?.getAttribute('content')).toBe('Entre na sua conta Worki.')
  })

  it('não renderiza meta description quando prop description ausente', () => {
    render(<PageMeta title="Entrar" />)
    const metaDesc = document.querySelector('meta[name="description"]')
    expect(metaDesc).toBeNull()
  })
})
