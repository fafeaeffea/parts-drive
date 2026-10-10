import { advantages } from '../../config/site'
import { RouteMap } from '../illustrations/RouteMap'

function Vis({ id }: { id: string }) {
  switch (id) {
    case 'suppliers':
      return <RouteMap auto className="why__map" />
    case 'vin':
      return (
        <div className="vin" aria-hidden>
          {'A1B2C3D4E5F6G7H8J'.split('').map((ch, i) => (
            <span key={i} className={i < 3 ? 'vin__wmi' : i < 9 ? 'vin__vds' : 'vin__vis'}>{ch}</span>
          ))}
          <div className="vin__legend mono"><span>WMI · производитель</span><span>VDS · модель</span><span>VIS · экземпляр</span></div>
        </div>
      )
    case 'price':
      return (
        <svg viewBox="0 0 220 110" className="why__svg" aria-hidden>
          <rect x="16" y="20" width="120" height="70" rx="6" />
          <path d="M30 42h70M30 56h50M30 70h60" className="thin" />
          <text x="120" y="48" className="why__q">₽</text>
          <circle cx="168" cy="55" r="26" className="why__ok" />
          <path d="M156 56l8 8 16-18" className="why__ok" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 220 110" className="why__svg" aria-hidden>
          <path d="M10 80 H210" className="thin" />
          <rect x="30" y="40" width="70" height="36" rx="3" />
          <path d="M100 52h26l14 14v10h-40z" />
          <circle cx="50" cy="82" r="8" /><circle cx="122" cy="82" r="8" />
          <rect x="160" y="30" width="36" height="36" rx="2" className="why__box" />
          <path d="M160 42h36M178 30v36" className="thin" />
        </svg>
      )
  }
}

export function Why() {
  return (
    <section className="section why" aria-labelledby="why-title">
      <div className="container">
        <p className="kicker mono" data-reveal>Почему мы</p>
        <h2 id="why-title" className="h1" data-reveal>Сервис, который берёт<br />задачу целиком</h2>
        <div className="why__grid">
          {advantages.map((a, i) => (
            <article key={a.id} className={`why__card why__card--${a.id}`} data-reveal style={{ transitionDelay: `${(i % 2) * 90}ms` }}>
              <div className="why__vis"><Vis id={a.id} /></div>
              <div>
                <span className="mono why__n">0{i + 1}</span>
                <h3>{a.title}</h3>
                <p className="muted">{a.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
