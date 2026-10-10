import { brand, contacts, legalLinks } from '../../config/site'
import { useLead } from '../../lib/lead'
import { Logo } from '../ui/Logo'

export function Footer() {
  const { openLead } = useLead()
  const year = brand.copyrightYear ?? new Date().getFullYear()
  const phoneHref = contacts.phone ? `tel:${contacts.phone.replace(/[^\d+]/g, '')}` : ''
  const hasAny = contacts.telegram || contacts.phone || contacts.email || contacts.city
  return (
    <footer id="contacts" className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo />
          <p className="muted">{brand.description}</p>
        </div>
        <div>
          <h3 className="mono footer__h">Контакты</h3>
          <ul className="footer__list">
            {contacts.telegram && <li><a href={`https://t.me/${contacts.telegram}`} target="_blank" rel="noopener">Telegram · @{contacts.telegram}</a></li>}
            {contacts.phone && <li><a href={phoneHref}>{contacts.phone}</a></li>}
            {contacts.email && <li><a href={`mailto:${contacts.email}`}>{contacts.email}</a></li>}
            {contacts.city && <li className="muted">{contacts.city}</li>}
            {!hasAny && <li className="muted">Свяжемся с вами по контакту из заявки</li>}
            <li><button className="link" onClick={() => openLead()}>Оставить заявку →</button></li>
          </ul>
        </div>
        <div>
          <h3 className="mono footer__h">Документы</h3>
          <ul className="footer__list">
            <li><a href={legalLinks.privacy} target="_blank" rel="noopener">Политика конфиденциальности</a></li>
            <li><a href={legalLinks.personalData} target="_blank" rel="noopener">Согласие на обработку персональных данных</a></li>
          </ul>
        </div>
      </div>
      <div className="container footer__bottom mono">
        <span>© {year} {brand.fullName}{contacts.legal ? ` · ${contacts.legal}` : ''}</span>
        <span>3D-модель на сайте — демонстрационная</span>
      </div>
    </footer>
  )
}
