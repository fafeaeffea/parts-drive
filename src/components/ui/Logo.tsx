import { brand } from '../../config/site'

export function Logo({ small }: { small?: boolean }) {
  return (
    <span className={`logo ${small ? 'logo--sm' : ''}`} aria-label={brand.fullName}>
      <svg className="logo__mark" viewBox="0 0 32 32" aria-hidden>
        <path d="M4 26 L14 6 h4 L8 26 Z" fill="currentColor" />
        <path d="M14 26 L24 6 h4 L18 26 Z" fill="var(--accent)" />
      </svg>
      <span className="logo__word">
        {brand.nameLeft}<i>//</i>{brand.nameRight}
      </span>
    </span>
  )
}
