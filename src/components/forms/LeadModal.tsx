import { useEffect, useRef } from 'react'
import { useLead } from '../../lib/lead'
import { LeadForm } from './LeadForm'
import { partCategories } from '../../config/site'

export function LeadModal() {
  const { modalOpen, closeLead, data } = useLead()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (modalOpen && !d.open) {
      d.showModal()
      document.documentElement.classList.add('modal-open')
    } else if (!modalOpen && d.open) {
      d.close()
    }
    if (!modalOpen) document.documentElement.classList.remove('modal-open')
  }, [modalOpen])

  const cat = partCategories.find((c) => c.id === data.category)

  return (
    <dialog ref={ref} className="modal" onClose={closeLead} aria-labelledby="lead-modal-title"
      onClick={(e) => { if (e.target === ref.current) closeLead() }}>
      <div className="modal__panel">
        <header className="modal__head">
          <div>
            <p className="kicker mono">Заявка на подбор{cat ? ` · ${cat.title}` : ''}</p>
            <h2 id="lead-modal-title">Подберём запчасть для вашего авто</h2>
          </div>
          <button className="icon-btn" onClick={closeLead} aria-label="Закрыть">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>
        {modalOpen && <LeadForm onDone={closeLead} />}
      </div>
    </dialog>
  )
}
