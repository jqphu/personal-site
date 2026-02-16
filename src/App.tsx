import { useEffect, useState } from 'react'

const blogPosts = [
  { title: 'Software Engineering is Dead', date: 'Feb 16, 2026', href: 'https://coreflow.dev/blog/software-engineering-is-dead.html' },
]

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
      {open && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-6 cursor-pointer"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-w-3xl w-full">
            <img src={src} alt={alt} className="w-full rounded" />
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

function Section({ title, children, defaultOpen = false }: {
  title: string
  children?: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="border-t border-[#222]">
      <h2 onClick={() => setOpen(!open)} className="text-sm font-normal py-5 cursor-pointer select-none flex items-center justify-between hover:text-white transition-colors">
        {title} <span className="text-[#666] text-sm">{open ? '−' : '+'}</span>
      </h2>
      {open && <div className="pb-6">{children}</div>}
    </section>
  )
}

function App() {
  return (
    <div className="max-w-[680px] mx-auto px-6 py-15">
      <header className="mb-15">
        <h1 className="text-xl font-medium mb-1">Justin Phu</h1>
        <div className="flex gap-4 mt-3">
          <a href="mailto:justin@phu.dev" className="text-[#888] text-sm font-light no-underline transition-colors hover:text-[#e8e8e8]">justin@phu.dev</a>
          <a href="https://github.com/jqphu" target="_blank" rel="noopener noreferrer" className="text-[#888] text-sm font-light no-underline transition-colors hover:text-[#e8e8e8]">GitHub</a>
        </div>
      </header>

      <Section title="About" defaultOpen>
        <div className="space-y-8">
          <div>
            <h3 className="text-xs font-medium text-[#777] uppercase tracking-widest mb-4"><a href="https://www.linkedin.com/in/justin-phu/" target="_blank" rel="noopener noreferrer" className="text-[#777] no-underline border-b border-[#444] hover:text-[#e8e8e8] hover:border-[#e8e8e8] transition-colors">Career ↗</a></h3>
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium">Co-Founder, <a href="https://coreflow.dev" target="_blank" rel="noopener noreferrer" className="text-[#e8e8e8] no-underline border-b border-[#444] hover:text-white hover:border-white transition-colors">coreflow ↗</a></p>
                <span className="text-[#777] text-xs shrink-0 ml-4">2025 –</span>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium">Co-Founder, <a href="https://pocketuniverse.app" target="_blank" rel="noopener noreferrer" className="text-[#e8e8e8] no-underline border-b border-[#444] hover:text-white hover:border-white transition-colors">Pocket Universe ↗</a> <span className="text-[#777] text-xs font-light italic">(Acquired)</span></p>
                <span className="text-[#777] text-xs shrink-0 ml-4">2022 – 2025</span>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium">Staff Engineer, Facebook</p>
                <span className="text-[#777] text-xs shrink-0 ml-4">2019 – 2022</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-[#777] uppercase tracking-widest mb-4">Values</h3>
            <ul className="text-[#999] text-xs font-light leading-[1.9] space-y-1 list-disc list-inside">
              <li>grit. <ImageLink src="/github-contributions.png" alt="GitHub contributions 2022–2026">keep building.</ImageLink></li>
              <li>have fun, it's easier. <ImageLink src="https://images.prismic.io/sketchplanations/281df432-3a48-4e78-ac58-1ff835091f99_SP+582+-+The+fun+scale+-+revised.png?auto=format%2Ccompress&fit=max&w=1920" alt="The fun scale — Type 1, 2, and 3 fun explained">type 2 fun.</ImageLink></li>
              <li>who you work with &gt;&gt; everything else</li>
              <li>never satisfied. always faster. always better.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-medium text-[#777] uppercase tracking-widest mb-4">Fitness</h3>
            <ul className="text-[#999] text-xs font-light leading-[1.9] space-y-1 list-disc list-inside">
              <li>lifting: 1,000lb club (squat 172.5 · bench 110 · deadlift 195kg)</li>
              <li>running: sub 2hr half → sub 4hr full</li>
              <li>tennis: USTA 3.5 → best 65+ year old player alive</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-medium text-[#777] uppercase tracking-widest mb-4">Life</h3>
            <ul className="text-[#999] text-xs font-light leading-[1.9] space-y-1 list-disc list-inside mb-4">
              <li>married</li>
              <li><ImageLink src="/100km-walk.png" alt="100km birthday walk — Apple Fitness stats showing 99.9km in 27 hours">walked 100km</ImageLink> for my birthday</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Blog" defaultOpen>
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
      </Section>
    </div>
  )
}

export default App
