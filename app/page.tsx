import { LandingNav } from '@/components/organisms/LandingNav'
import { HeroSection } from '@/components/organisms/HeroSection'
import { StepsSection } from '@/components/organisms/StepsSection'
import { DualCTA } from '@/components/organisms/DualCTA'
import { Logo } from '@/components/atoms/Logo'
import { Toast } from '@/components/atoms/Toast'

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <HeroSection />
      <StepsSection />
      <DualCTA />

      <footer className="bg-navy border-t border-white/[.06] px-[5%] py-9 flex flex-wrap justify-between items-center gap-4">
        <Logo variant="light" />
        <div className="flex gap-6">
          {['Términos', 'Privacidad', 'Soporte'].map((l) => (
            <a key={l} href="#" className="text-[13px] text-white/50 no-underline hover:text-white/80 transition-colors">
              {l}
            </a>
          ))}
        </div>
        <span className="text-xs text-white/30">© 2025 Pacta Technologies SAS · Bogotá</span>
      </footer>

      <Toast />
    </>
  )
}
