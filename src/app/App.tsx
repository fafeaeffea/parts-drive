import { useEffect } from 'react'
import { LeadProvider } from '../lib/lead'
import { useRenderMode } from '../lib/device'
import { Header } from '../components/ui/Header'
import { StorySection } from '../components/sections/StorySection'
import { Problem } from '../components/sections/Problem'
import { HowItWorks } from '../components/sections/HowItWorks'
import { Anatomy } from '../components/sections/Anatomy'
import { Categories } from '../components/sections/Categories'
import { Cars } from '../components/sections/Cars'
import { WizardSection } from '../components/sections/WizardSection'
import { Why } from '../components/sections/Why'
import { Faq } from '../components/sections/Faq'
import { FinalCta } from '../components/sections/FinalCta'
import { Footer } from '../components/sections/Footer'
import { LeadModal } from '../components/forms/LeadModal'

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
      }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    const scan = () => document.querySelectorAll('[data-reveal]:not(.in)').forEach((n) => io.observe(n))
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect() }
  }, [])
}

export function App() {
  const mode = useRenderMode()
  useReveal()
  return (
    <LeadProvider>
      <a className="skip" href="#request">Перейти к заявке</a>
      <Header />
      <main>
        <StorySection mode={mode} />
        <Problem />
        <HowItWorks />
        <Anatomy mode={mode} />
        <Categories />
        <Cars />
        <WizardSection />
        <Why />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <LeadModal />
    </LeadProvider>
  )
}
