import { useState } from 'react'

const blogPosts = [
  { title: 'Software Engineering is Dead', date: 'Feb 16, 2026', href: 'https://coreflow.dev/blog/software-engineering-is-dead.html' },
]

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
        <p className="text-[#888] text-sm font-light mb-3">
          Co-founder{' '}
          <a href="https://coreflow.dev" target="_blank" rel="noopener noreferrer" className="text-[#888] no-underline border-b border-[#444] transition-colors hover:text-[#e8e8e8] hover:border-[#e8e8e8]">
            coreflow
          </a>
        </p>
        <div className="flex gap-4">
          <a href="mailto:justin@phu.dev" className="text-[#888] text-sm font-light no-underline transition-colors hover:text-[#e8e8e8]">justin@phu.dev</a>
          <a href="https://github.com/jqphu" target="_blank" rel="noopener noreferrer" className="text-[#888] text-sm font-light no-underline transition-colors hover:text-[#e8e8e8]">GitHub</a>
        </div>
      </header>

      <Section title="About" defaultOpen>
        <div className="space-y-8">
          <div>
            <h3 className="text-xs font-medium text-[#777] uppercase tracking-widest mb-4">Career</h3>
            <div className="space-y-6">
              <div className="group">
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-sm font-medium">Co-Founder, <a href="https://coreflow.dev" target="_blank" rel="noopener noreferrer" className="text-[#e8e8e8] no-underline border-b border-[#333] hover:text-white hover:border-white transition-colors">coreflow</a></p>
                  <span className="text-[#777] text-xs shrink-0 ml-4">2025 –</span>
                </div>
                <p className="text-[#999] text-xs font-light leading-[1.9]">AI entertainment, 10m+ users, top 50 AI site globally, $XXM revenue run rate, wrote 80% of the code (well... claude did)</p>
              </div>
              <div className="group">
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-sm font-medium">Co-Founder, <a href="https://pocketuniverse.app" target="_blank" rel="noopener noreferrer" className="text-[#e8e8e8] no-underline border-b border-[#333] hover:text-white hover:border-white transition-colors">Pocket Universe</a> <span className="text-[#777] text-xs font-light italic">(Acquired)</span></p>
                  <span className="text-[#777] text-xs shrink-0 ml-4">2022 – 2025</span>
                </div>
                <p className="text-[#999] text-xs font-light leading-[1.9]">crypto fraud protection, 0→200k weekly active users, &gt;$1B in assets protected, $4M+ revenue run rate (70%+ profit), wrote 80%+ of the code</p>
              </div>
              <div className="group">
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-sm font-medium">Staff Engineer, Facebook</p>
                  <span className="text-[#777] text-xs shrink-0 ml-4">2019 – 2022</span>
                </div>
                <p className="text-[#999] text-xs font-light leading-[1.9]">building a microkernel operating system from scratch, led a six-person runtime team, new grad → staff in 2 years</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-[#777] uppercase tracking-widest mb-4">Always building</h3>
            <p className="text-[#999] text-xs font-light leading-[1.9] mb-4">I'm always building things, sometimes it's useful.</p>
            <img src="/github-contributions.png" alt="GitHub contributions 2022–2026" className="w-full rounded opacity-90" />
          </div>
          <div>
            <h3 className="text-xs font-medium text-[#777] uppercase tracking-widest mb-4">Fitness</h3>
            <ul className="text-[#999] text-xs font-light leading-[1.9] space-y-1">
              <li>🏋️ 1,000lb club — squat 172.5kg · bench 110kg · deadlift 195kg</li>
              <li>🏃 sub 2hr half marathon → chasing a sub 4hr marathon</li>
              <li>🎾 aspiring best 65+ tennis player — currently terrible at USTA 3.5</li>
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
