import { useEffect, useState } from 'react'
import { nav } from '../../config/site'
import { useLead } from '../../lib/lead'
import { Logo } from './Logo'

export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { openLead } = useLead()

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open)
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    scrollToId(id)
  }

  return (
    <header className={`header ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <div className="header__inner">
        <a href="#top" className="header__logo" onClick={go('top')}><Logo /></a>
        <nav className="header__nav" aria-label="Основное меню">
          {nav.map((n) => <a key={n.id} href={`#${n.id}`} onClick={go(n.id)}>{n.label}</a>)}
        </nav>
        <button className="btn btn--sm btn--outline header__cta" onClick={() => openLead()}>Оставить заявку</button>
        <button className="burger" aria-label={open ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={open} aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}>
          <span /><span />
        </button>
      </div>
      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        <nav aria-label="Мобильное меню">
          {nav.map((n, i) => (
            <a key={n.id} href={`#${n.id}`} onClick={go(n.id)} style={{ transitionDelay: `${60 + i * 40}ms` }}>
              <span className="mono">0{i + 1}</span>{n.label}
            </a>
          ))}
        </nav>
        <button className="btn btn--primary btn--block" onClick={() => { setOpen(false); openLead() }}>Оставить заявку</button>
      </div>
    </header>
  )
}
