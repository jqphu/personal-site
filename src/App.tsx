import { useEffect, useState } from 'react'

interface WhoopData {
  fetchedAt: string
  latest: {
    recovery: {
      score: {
        recovery_score: number
        resting_heart_rate: number
        hrv_rmssd_milli: number
        spo2_percentage: number
        skin_temp_celsius: number
      }
    }
    sleep: {
      score: {
        sleep_performance_percentage: number
        stage_summary: {
          total_in_bed_time_milli: number
          total_awake_time_milli: number
          total_light_sleep_time_milli: number
          total_slow_wave_sleep_time_milli: number
          total_rem_sleep_time_milli: number
        }
      }
    }
    cycle: {
      score: {
        strain: number
        kilojoule: number
        average_heart_rate: number
        max_heart_rate: number
      }
    }
  }
}

function msToHours(ms: number) {
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return `${h}h ${m}m`
}

function WhoopStat({ label, value, children }: {
  label: string
  value: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="cursor-pointer text-left w-full"
      >
        <p className="text-[#666] text-[10px] uppercase tracking-wider mb-1 hover:text-[#999] transition-colors">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="text-[#999] text-[10px] font-light space-y-0.5">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function WhoopStats() {
  const [data, setData] = useState<WhoopData | null>(null)

  useEffect(() => {
    fetch('/api/whoop-data')
      .then(r => r.ok ? r.json() : Promise.reject())
      .catch(() => fetch('/whoop-data.json').then(r => r.json()))
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return null

  const { recovery, sleep, cycle } = data.latest
  const r = recovery.score
  const s = sleep.score
  const stages = s.stage_summary
  const totalSleep = stages.total_in_bed_time_milli - stages.total_awake_time_milli

  const fetchedDate = new Date(data.fetchedAt)
  const time = fetchedDate.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
  const date = fetchedDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  const formatted = `${time}, ${date}`

  return (
    <div>
      <p className="text-[#555] text-[10px] font-light mb-3">whoop · last updated {formatted}</p>
      <div className="grid grid-cols-3 gap-4">
        <WhoopStat label="Sleep" value={msToHours(totalSleep)}>
          <p>perf {s.sleep_performance_percentage}%</p>
          <p>REM {msToHours(stages.total_rem_sleep_time_milli)}</p>
          <p>deep {msToHours(stages.total_slow_wave_sleep_time_milli)}</p>
        </WhoopStat>
        <WhoopStat label="Recovery" value={`${r.recovery_score}%`}>
          <p>HRV {r.hrv_rmssd_milli.toFixed(0)}ms</p>
          <p>RHR {r.resting_heart_rate}bpm</p>
          <p>SpO2 {r.spo2_percentage.toFixed(1)}%</p>
        </WhoopStat>
        <WhoopStat label="Strain" value={cycle.score.strain.toFixed(1)}>
          <p>avg HR {cycle.score.average_heart_rate}bpm</p>
          <p>max HR {cycle.score.max_heart_rate}bpm</p>
          <p>{(cycle.score.kilojoule / 4.184).toFixed(0)} cal</p>
        </WhoopStat>
      </div>
    </div>
  )
}

const blogPosts = [
  { title: 'Software Engineering is Dead', date: 'Feb 16, 2026', href: 'https://coreflow.dev/blog/software-engineering-is-dead.html' },
]

function BlogSection() {
  const [open, setOpen] = useState(true)

  return (
    <section>
      <button onClick={() => setOpen(!open)} className="text-xs font-medium text-[#A78BCA] uppercase tracking-widest mb-4 cursor-pointer hover:text-[#c4a8e6] transition-colors flex items-center gap-2">
        Blog <span className="text-[#555] text-[10px]">{open ? '−' : '+'}</span>
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
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

function App() {
  return (
    <div className="max-w-[680px] mx-auto px-6 pt-6 pb-15">
      <header className="mb-8">
        <h1 className="text-xl font-medium mb-1">Justin Phu</h1>

        <div className="mt-6">
          <WhoopStats />
        </div>
      </header>

      <div className="space-y-10">
        <BlogSection />

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

        <section>
          <h2 className="text-xs font-medium text-[#A78BCA] uppercase tracking-widest mb-4">Values</h2>
          <ul className="text-[#999] text-xs font-light leading-[1.9] space-y-1 list-disc list-inside">
            <li>grit. <ImageLink src="/github-contributions.png" alt="GitHub contributions 2022–2026">keep building.</ImageLink></li>
            <li>have fun, it's easier. <ImageLink src="https://images.prismic.io/sketchplanations/281df432-3a48-4e78-ac58-1ff835091f99_SP+582+-+The+fun+scale+-+revised.png?auto=format%2Ccompress&fit=max&w=1920" alt="The fun scale — Type 1, 2, and 3 fun explained">type 2 fun.</ImageLink></li>
            <li>who you work with &gt;&gt; everything else</li>
            <li>never satisfied. always faster. always better.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xs font-medium text-[#A78BCA] uppercase tracking-widest mb-4">Fitness</h2>
          <ul className="text-[#999] text-xs font-light leading-[1.9] space-y-1 list-disc list-inside">
              <li>lifting: 1,000lb total club
                <p className="ml-4 text-[#666]">squat 172.5kg · bench 110kg · deadlift 195kg</p>
              </li>
              <li>running: sub 2hr half
                <p className="ml-4 text-[#666]">goal: sub 4hr marathon</p>
              </li>
              <li>tennis: USTA 3.5
                <p className="ml-4 text-[#666]">goal: best tennis player 65 years or older</p>
              </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xs font-medium text-[#A78BCA] uppercase tracking-widest mb-4">Life</h2>
          <ul className="text-[#999] text-xs font-light leading-[1.9] space-y-1 list-disc list-inside">
            <li>29 chronological age, 21.6 whoop age</li>
            <li>married</li>
            <li><ImageLink src="/100km-walk.png" alt="100km birthday walk — Apple Fitness stats showing 99.9km in 27 hours">walked 100km</ImageLink> for my birthday</li>
          </ul>
        </section>

      </div>
    </div>
  )
}

export default App
