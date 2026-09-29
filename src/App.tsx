import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Analytics } from '@vercel/analytics/react'

function FadeIn({ delay = 0, className = '', children }: {
  delay?: number
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`${visible ? 'animate-fade-up' : 'opacity-0'} ${className}`}
      style={visible ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

const blogPosts = [
  { title: 'Do Hard Things', date: 'May 5, 2026', href: '/blog/do-hard-things.html' },
  { title: 'Software Engineering is Dead', date: 'Feb 16, 2026', href: 'https://coreflow.dev/blog/software-engineering-is-dead.html' },
]

function BlogSection() {
  const [open, setOpen] = useState(true)

  return (
    <section>
      <button onClick={() => setOpen(!open)} className="text-xs font-medium text-[#A78BCA] uppercase tracking-widest mb-4 cursor-pointer hover:text-[#c4a8e6] transition-colors flex items-center gap-2">
        Blog <span className="text-[#555] text-[10px]">{open ? '−' : '+'}</span>
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <ul className="list-none">
            {blogPosts.map((post) => (
              <li key={post.title} className="border-t border-[#1a1a1a] first:border-t-0">
                <a href={post.href} className="flex items-baseline gap-4 py-3.5 text-[#e8e8e8] no-underline transition-colors hover:text-white">
                  <span className="flex-1 text-sm">{post.title}</span>
                  <span className="text-[#777] text-xs shrink-0">{post.date}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function ImageLink({ src, alt, children }: {
  src: string
  alt: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[#888] text-xs font-light no-underline border-b border-dashed border-[#444] transition-colors hover:text-[#e8e8e8] hover:border-[#e8e8e8] cursor-pointer"
      >
        {children}
      </button>
      {open && createPortal(
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-6 cursor-pointer animate-lightbox-backdrop"
          onClick={() => setOpen(false)}
        >
          <div className="relative animate-lightbox-content">
            <img src={src} alt={alt} className="max-w-[90vw] max-h-[85vh] object-contain rounded block" />
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-8 right-0 text-[#666] hover:text-white text-sm transition-colors cursor-pointer"
            >
              esc
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function VideoLink({ src, children }: {
  src: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  useEffect(() => {
    if (!open) setLoading(true)
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[#888] text-xs font-light no-underline border-b border-dashed border-[#444] transition-colors hover:text-[#e8e8e8] hover:border-[#e8e8e8] cursor-pointer"
      >
        {children}
      </button>
      {open && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-6 cursor-pointer animate-lightbox-backdrop"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-w-3xl w-full flex items-center justify-center animate-lightbox-content">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-48 h-80 rounded bg-[#1a1a1a] animate-pulse" />
                <p className="text-[#555] text-xs animate-pulse">loading video...</p>
              </div>
            )}
            <video
              src={src}
              controls
              autoPlay
              loop

              playsInline
              onCanPlay={() => setLoading(false)}
              className={`max-w-full max-h-[85vh] mx-auto rounded transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-8 right-0 text-[#666] hover:text-white text-sm transition-colors cursor-pointer"
            >
              esc
            </button>
          </div>
        </div>
      )}
    </>
  )
}

const MARATHON_SPLITS = [290, 307, 300, 294, 281, 318, 290, 321, 302, 293, 309, 299, 312, 331, 301, 329, 305, 320, 313, 301, 331, 309, 341, 322, 321, 364, 355, 356, 372, 335, 370, 359, 388, 381, 364, 408, 379, 368, 389, 372, 385, 360, 339]

const HALF_MARATHON_SPLITS = [294, 292, 292, 294, 295, 288, 296, 289, 295, 297, 294, 292, 292, 291, 289, 290, 289, 293, 335, 302, 291]

function formatPace(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec - m * 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function PaceBars({ splits, finishTime }: { splits: number[], finishTime: string }) {
  const [open, setOpen] = useState(false)
  const fastest = Math.min(...splits)
  const slowest = Math.max(...splits)
  const range = slowest - fastest || 1
  return (
    <div className="ml-4 mt-1.5">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={open ? 'hide km splits' : 'show km splits'}
        className="group flex items-center gap-2.5 w-full cursor-pointer py-1 -my-1"
      >
        <span className="text-[#888] text-xs font-light tabular-nums group-hover:text-[#e8e8e8] transition-colors">{finishTime}</span>
        <span className="flex items-end gap-[1px] h-5 flex-1 min-w-0" aria-hidden="true">
          {splits.map((s, i) => {
            const norm = (slowest - s) / range
            const h = 25 + norm * 75
            const isFastest = s === fastest
            const opacity = 0.35 + norm * 0.65
            return (
              <span
                key={i}
                className={`flex-1 rounded-[1px] transition-all ${isFastest ? 'bg-[#A78BCA]' : 'bg-[#888] group-hover:bg-[#aaa]'}`}
                style={{ height: `${h}%`, opacity: isFastest ? 1 : opacity }}
              />
            )
          })}
        </span>
        <span className="text-[#555] text-[10px] font-light w-3 text-right">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-2.5 space-y-[3px]">
          {splits.map((s, i) => {
            const norm = (slowest - s) / range
            const w = 20 + norm * 80
            const isFastest = s === fastest
            return (
              <div key={i} className="flex items-center gap-2.5 text-[11px] font-light tabular-nums leading-none whitespace-nowrap">
                <span className="text-[#555] w-10">km {i + 1}</span>
                <span className={`w-10 ${isFastest ? 'text-[#A78BCA]' : 'text-[#888]'}`}>{formatPace(s)}</span>
                <span className="flex-1 h-[3px] bg-[#222] rounded-full overflow-hidden">
                  <span
                    className={`block h-full rounded-full ${isFastest ? 'bg-[#A78BCA]' : 'bg-[#555]'}`}
                    style={{ width: `${w}%` }}
                  />
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <div className="max-w-[680px] mx-auto px-6 pt-6 pb-15">
      <header className="mb-8">
        <FadeIn>
          <h1 className="text-xl font-medium mb-1">Justin Phu</h1>
          <div className="flex gap-4 mt-1">
            <a href="mailto:justin@phu.dev" className="text-[#888] text-sm font-light no-underline transition-colors hover:text-[#e8e8e8]">justin@phu.dev</a>
          </div>
        </FadeIn>
      </header>

      <div className="space-y-10">
        <FadeIn delay={200}>
          <BlogSection />
        </FadeIn>

        <FadeIn>
          <section>
            <h2 className="text-xs font-medium text-[#A78BCA] uppercase tracking-widest mb-4"><a href="https://www.linkedin.com/in/justin-phu/" target="_blank" rel="noopener noreferrer" className="text-[#A78BCA] no-underline border-b border-[#444] hover:text-[#e8e8e8] hover:border-[#e8e8e8] transition-colors">Career ↗</a></h2>
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium">Co-Founder, <a href="https://coreflow.dev" target="_blank" rel="noopener noreferrer" className="text-[#e8e8e8] no-underline border-b border-[#444] hover:text-white hover:border-white transition-colors">coreflow ↗</a></p>
                <span className="text-[#777] text-xs shrink-0 ml-4">2025 –</span>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium">Co-Founder, <a href="https://pocketuniverse.app" target="_blank" rel="noopener noreferrer" className="text-[#e8e8e8] no-underline border-b border-[#444] hover:text-white hover:border-white transition-colors">Pocket Universe ↗</a> <span className="text-[#777] text-xs font-light italic">(Acq.)</span></p>
                <span className="text-[#777] text-xs shrink-0 ml-2">2022 – 2025</span>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium">Staff Engineer, Facebook</p>
                <span className="text-[#777] text-xs shrink-0 ml-4">2019 – 2022</span>
              </div>
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section>
            <h2 className="text-xs font-medium text-[#A78BCA] uppercase tracking-widest mb-4">Values</h2>
            <ul className="text-[#999] text-xs font-light leading-[1.9] space-y-1 list-disc list-inside">
              <li>grit. <ImageLink src="/github-contributions.png" alt="GitHub contributions 2022–2026">keep building.</ImageLink></li>
              <li>have fun, it's easier. <ImageLink src="https://images.prismic.io/sketchplanations/281df432-3a48-4e78-ac58-1ff835091f99_SP+582+-+The+fun+scale+-+revised.png?auto=format%2Ccompress&fit=max&w=1920" alt="The fun scale — Type 1, 2, and 3 fun explained">type 2 fun.</ImageLink></li>
              <li>who you work with &gt;&gt; everything else</li>
              <li>never satisfied. always faster. always better.</li>
            </ul>
          </section>
        </FadeIn>

        <FadeIn>
          <section>
            <h2 className="text-xs font-medium text-[#A78BCA] uppercase tracking-widest mb-4">Fitness</h2>
            <ul className="text-[#999] text-xs font-light leading-[1.9] space-y-1 list-disc list-inside">
                <li>lifting: 1,000lb total club <span className="text-[#555]">Jun '25</span>
                  <p className="ml-4 text-[#666]"><VideoLink src="/squat.mp4">squat 172.5kg</VideoLink> · <VideoLink src="/bench.mp4">bench 110kg</VideoLink> · <VideoLink src="/deadlift.mp4">deadlift 195kg</VideoLink></p>
                </li>
                <li>running:
                  <p className="ml-4 text-[#666]">half-marathon PR: 1:43:41 <span className="text-[#555]">Jul '26</span></p>
                  <PaceBars splits={HALF_MARATHON_SPLITS} finishTime="1:43:41" />
                  <p className="ml-4 text-[#666]">marathon PR: 3:59:01 <span className="text-[#555]">Sydney · Aug '26</span></p>
                  <PaceBars splits={MARATHON_SPLITS} finishTime="3:59:01" />
                  <p className="ml-4 text-[#666]">marathon goal: 3:30 🙏</p>
                </li>
                <li><ImageLink src="/half-ironman.jpg" alt="Western Sydney Half Ironman">Western Sydney Half Ironman</ImageLink> <span className="text-[#555]">May '26</span>
                  <div className="ml-4 mt-1.5 grid grid-cols-[3.5rem_4.5rem_auto] gap-x-3 gap-y-[3px] text-[#888] tabular-nums leading-relaxed">
                    <span className="text-[#666]"><span aria-hidden="true">🏊</span> swim</span><span>54:08</span><span className="text-[#555]">2:49 /100m</span>
                    <span className="text-[#666]"><span aria-hidden="true">🚴</span> bike</span><span>3:19:40</span><span className="text-[#555]">26.9 km/h</span>
                    <span className="text-[#666]"><span aria-hidden="true">🏃</span> run</span><span>2:13:18</span><span className="text-[#555]">6:21 /km</span>
                  </div>
                </li>
                <li>Sydney Backyard Ultra: 10 yards · 67km in 10h <span className="text-[#555]">Sep '26</span></li>
                <li>tennis: USTA 3.5
                  <p className="ml-4 text-[#666]">goal: best tennis player 65 years or older</p>
                </li>
            </ul>
            <p className="text-[#666] text-[10px] uppercase tracking-wider mt-5 mb-3">Upcoming</p>
            <div className="space-y-2">
              {[
                { name: 'Ironman AUS or Cozumel', date: '2026-10-18' },
              ].map(({ name, date }) => {
                const target = new Date(date)
                const now = new Date()
                const totalDays = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86_400_000))
                const weeks = Math.floor(totalDays / 7)
                const days = totalDays % 7
                const countdown = weeks > 0 ? `${weeks}w ${days}d` : `${days}d`
                return (
                  <div key={name}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[#999] text-xs font-light">{name}</span>
                      <span className="text-[#555] text-[10px] font-light tabular-nums">{countdown}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section>
            <h2 className="text-xs font-medium text-[#A78BCA] uppercase tracking-widest mb-4">Life</h2>
            <ul className="text-[#999] text-xs font-light leading-[1.9] space-y-1 list-disc list-inside">
              <li>29 chronological age, 20.7 whoop age</li>
              <li>married</li>
              <li><ImageLink src="/100km-walk.png" alt="100km birthday walk — Apple Fitness stats showing 99.9km in 27 hours">walked 100km</ImageLink> for my birthday</li>
            </ul>
          </section>
        </FadeIn>

      </div>
      <Analytics />
    </div>
  )
}

export default App
