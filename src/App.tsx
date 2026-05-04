import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Analytics } from '@vercel/analytics/react'

interface WhoopWorkoutScore {
  strain: number
  average_heart_rate: number
  max_heart_rate: number
  kilojoule: number
  zone_durations?: {
    zone_zero_milli: number
    zone_one_milli: number
    zone_two_milli: number
    zone_three_milli: number
    zone_four_milli: number
    zone_five_milli: number
  }
}

interface WhoopWorkout {
  sport_name: string
  start: string
  end: string
  score: WhoopWorkoutScore | null
}

interface WhoopRecoveryScore {
  recovery_score: number
  resting_heart_rate: number
  hrv_rmssd_milli: number
  spo2_percentage: number
  skin_temp_celsius: number
}

interface WhoopRecovery {
  cycle_id: number
  created_at: string
  score_state: string
  score: WhoopRecoveryScore
}

interface WhoopSleepStageSummary {
  total_in_bed_time_milli: number
  total_awake_time_milli: number
  total_light_sleep_time_milli: number
  total_slow_wave_sleep_time_milli: number
  total_rem_sleep_time_milli: number
}

interface WhoopSleepScore {
  sleep_performance_percentage: number
  stage_summary: WhoopSleepStageSummary
}

interface WhoopSleep {
  cycle_id: number
  created_at: string
  end: string
  score_state: string
  score: WhoopSleepScore
}

interface WhoopCycleScore {
  strain: number
  kilojoule: number
  average_heart_rate: number
  max_heart_rate: number
}

interface WhoopCycle {
  id: number
  created_at: string
  start: string
  end: string | null
  score_state: string
  score: WhoopCycleScore | null
}

interface WhoopData {
  fetchedAt: string
  latest: {
    recovery: WhoopRecovery
    sleep: WhoopSleep
    cycle: WhoopCycle
  }
  recoveries?: WhoopRecovery[]
  sleeps?: WhoopSleep[]
  cycles?: WhoopCycle[]
  workouts?: WhoopWorkout[]
}

type WhoopMetric = 'sleep' | 'recovery' | 'strain'

type ScoredWorkout = WhoopWorkout & { score: WhoopWorkoutScore }

interface WhoopHistoryDay {
  key: string
  label: string
  shortLabel: string
  sleepScore: number | null
  recoveryScore: number | null
  strainScore: number | null
  workouts: ScoredWorkout[]
}

function msToHours(ms: number) {
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return `${h}h ${m}m`
}

function formatMinutes(ms: number) {
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function toDayKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatShortDayLabel(date: Date) {
  return date.toLocaleDateString('en-AU', { weekday: 'short' })
}

function getMetricValue(day: WhoopHistoryDay, metric: WhoopMetric) {
  if (metric === 'sleep') return day.sleepScore
  if (metric === 'recovery') return day.recoveryScore
  return day.strainScore
}

function formatMetricValue(metric: WhoopMetric, value: number | null) {
  if (value == null) return '—'
  return metric === 'strain' ? value.toFixed(1) : `${Math.round(value)}%`
}

function formatMetricLabel(metric: WhoopMetric, value: number | null) {
  return `${metric} ${formatMetricValue(metric, value)}`
}

function getMetricScale(metric: WhoopMetric) {
  return metric === 'strain' ? 21 : 100
}

function isScoredWorkout(workout: WhoopWorkout): workout is ScoredWorkout {
  return workout.score != null
}

function buildWhoopHistoryDays(data: WhoopData): WhoopHistoryDay[] {
  const endDate = new Date(data.fetchedAt)
  endDate.setHours(0, 0, 0, 0)

  const days: WhoopHistoryDay[] = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(endDate)
    date.setDate(endDate.getDate() - (13 - index))
    return {
      key: toDayKey(date),
      label: formatDayLabel(date),
      shortLabel: formatShortDayLabel(date),
      sleepScore: null,
      recoveryScore: null,
      strainScore: null,
      workouts: [] as ScoredWorkout[],
    }
  })

  const byKey = new Map(days.map(day => [day.key, day]))

  for (const sleep of data.sleeps ?? []) {
    if (sleep.score_state !== 'SCORED') continue
    const day = byKey.get(toDayKey(new Date(sleep.end)))
    if (day) day.sleepScore = sleep.score.sleep_performance_percentage
  }

  for (const recovery of data.recoveries ?? []) {
    if (recovery.score_state !== 'SCORED') continue
    const day = byKey.get(toDayKey(new Date(recovery.created_at)))
    if (day) day.recoveryScore = recovery.score.recovery_score
  }

  for (const cycle of data.cycles ?? []) {
    if (cycle.score_state !== 'SCORED' || cycle.score == null || cycle.end == null) continue
    const cycleDay = new Date(cycle.end)
    cycleDay.setDate(cycleDay.getDate() - 1)
    const day = byKey.get(toDayKey(cycleDay))
    if (day) day.strainScore = cycle.score.strain
  }

  for (const workout of data.workouts ?? []) {
    if (!isScoredWorkout(workout) || workout.score.strain <= 5 || workout.sport_name === 'walking') continue
    const day = byKey.get(toDayKey(new Date(workout.start)))
    if (day) day.workouts.push(workout)
  }

  for (const day of days) {
    day.workouts.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
  }

  return days
}

function WhoopStat({ label, value, active, onClick }: {
  label: string
  value: string
  active: boolean
  onClick: () => void
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        className="cursor-pointer text-left w-full"
      >
        <p className={`text-[10px] uppercase tracking-wider mb-1 transition-colors ${active ? 'text-[#A78BCA]' : 'text-[#666] hover:text-[#999]'}`}>{label}</p>
        <p className={`text-sm font-medium transition-colors ${active ? 'text-white' : ''}`}>{value}</p>
      </button>
    </div>
  )
}

function useWhoopData() {
  const [data, setData] = useState<WhoopData | null>(null)

  useEffect(() => {
    fetch('/api/whoop-data')
      .then(r => r.ok ? r.json() : Promise.reject())
      .catch(() => fetch('/whoop-data.json').then(r => r.json()))
      .then(setData)
      .catch(() => {})
  }, [])

  return data
}

function normalizeSport(name: string): string {
  if (name === 'weightlifting_msk' || name === 'powerlifting') return 'weightlifting'
  return name
}

const sportEmoji: Record<string, string> = {
  running: '🏃',
  weightlifting: '🏋️',
  tennis: '🎾',
  yoga: '🧘',
  'sprint-training': '⚡',
  cycling: '🚴',
  swimming: '🏊',
}

function DailyMetricStrip({ day, activeMetric }: { day: WhoopHistoryDay, activeMetric?: WhoopMetric }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-light">
      {(['sleep', 'recovery', 'strain'] as const).map((metric) => (
        <span
          key={metric}
          className={activeMetric === metric ? 'text-[#e8e8e8]' : 'text-[#666]'}
        >
          {formatMetricLabel(metric, getMetricValue(day, metric))}
        </span>
      ))}
    </div>
  )
}

function WhoopHistoryPanel({ metric, open, days, summaryLines = [] }: {
  metric: WhoopMetric
  open: boolean
  days: WhoopHistoryDay[]
  summaryLines?: string[]
}) {
  const values = days
    .map(day => getMetricValue(day, metric))
    .filter((value): value is number => value != null)
  const average = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null
  const peak = values.length > 0 ? Math.max(...values) : null
  const metricColor = metric === 'recovery' ? '#A78BCA' : metric === 'sleep' ? '#777' : '#999'

  return (
    <div className={`grid transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
      <div className="overflow-hidden">
        <div className="border-t border-[#1a1a1a] pt-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-[#666] text-[10px] uppercase tracking-wider">{metric} <span className="normal-case text-[#555]">(last 14 days)</span></p>
            <p className="text-[#555] text-[10px] font-light">
              avg {formatMetricValue(metric, average)} · {metric === 'strain' ? 'peak' : 'best'} {formatMetricValue(metric, peak)}
            </p>
          </div>

          {summaryLines.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[#999] text-[10px] font-light mb-3">
              {summaryLines.map(line => <span key={line}>{line}</span>)}
            </div>
          )}

          <div className="grid gap-1.5 mb-4" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
            {days.map(day => {
              const value = getMetricValue(day, metric)
              const fill = value == null ? 0 : Math.max(8, (value / getMetricScale(metric)) * 100)
              return (
                <div key={day.key} className="min-w-0">
                  <div className="h-16 rounded-[3px] bg-[#121212] border border-[#1a1a1a] overflow-hidden flex items-end">
                    <div
                      className="w-full rounded-[2px] transition-all duration-500"
                      style={{
                        height: `${fill}%`,
                        backgroundColor: value == null ? '#1a1a1a' : metricColor,
                        opacity: value == null ? 0.5 : 1,
                      }}
                    />
                  </div>
                  <p className="text-[#555] text-[9px] font-light text-center mt-1 truncate">{day.shortLabel}</p>
                </div>
              )
            })}
          </div>

          <div className="space-y-2">
            {[...days].reverse().map(day => (
              <div key={day.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-t border-[#151515] pt-2 first:border-t-0 first:pt-0">
                <p className="text-[#555] text-[10px] font-light shrink-0">{day.label}</p>
                <DailyMetricStrip day={day} activeMetric={metric} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

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

function WhoopActivities({ data }: { data: WhoopData }) {
  const [open, setOpen] = useState(false)

  const days = buildWhoopHistoryDays(data)
  const activities = days.flatMap(day => day.workouts)

  if (activities.length === 0) return null

  const counts: Record<string, number> = {}
  for (const w of activities) {
    const name = normalizeSport(w.sport_name)
    counts[name] = (counts[name] || 0) + 1
  }
  const summary = Object.entries(counts).sort((a, b) => b[1] - a[1])

  return (
    <div className="mt-4 animate-fade-in">
      <p className="text-[#666] text-[10px] uppercase tracking-wider mb-2">Activities <span className="normal-case text-[#555]">(last 14 days)</span></p>
      <div className="flex flex-wrap gap-3 text-[10px] text-[#999] font-light">
        {summary.map(([sport, count], i) => (
          <span key={sport} className="grayscale animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>{sportEmoji[sport] || '💪'} {sport} x{count}</span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-[#555] text-[10px] cursor-pointer hover:text-[#999] transition-colors mt-2"
      >
        {open ? 'hide details −' : 'details +'}
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          {(() => {
            const z = activities.reduce((acc, w) => {
              const zd = w.score.zone_durations
              if (!zd) return acc
              return {
                low: acc.low + zd.zone_one_milli + zd.zone_two_milli,
                mid: acc.mid + zd.zone_three_milli,
                high: acc.high + zd.zone_four_milli + zd.zone_five_milli,
              }
            }, { low: 0, mid: 0, high: 0 })
            const total = z.low + z.mid + z.high
            if (total === 0) return null
              const lowPct = Math.round((z.low / total) * 100)
              const midPct = Math.round((z.mid / total) * 100)
              const highPct = Math.round((z.high / total) * 100)
              const C = 2 * Math.PI * 28
              const lowArc = (lowPct / 100) * C
              const midArc = (midPct / 100) * C
              const highArc = (highPct / 100) * C
              return (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-[10px] mb-3">
                  <div className="flex items-center gap-3">
                    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#1a1a1a" strokeWidth="7" />
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke="#444"
                        strokeWidth="7"
                        strokeDasharray={`${lowArc} ${C - lowArc}`}
                        strokeDashoffset={C}
                        transform="rotate(-90 32 32)"
                        className="animate-ring-draw"
                        style={{ '--ring-circumference': C, '--ring-offset': 0 } as React.CSSProperties}
                      />
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke="#777"
                        strokeWidth="7"
                        strokeDasharray={`${midArc} ${C - midArc}`}
                        strokeDashoffset={C}
                        transform="rotate(-90 32 32)"
                        className="animate-ring-draw"
                        style={{ '--ring-circumference': C, '--ring-offset': -lowArc, animationDelay: '0.15s' } as React.CSSProperties}
                      />
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke="#A78BCA"
                        strokeWidth="7"
                        strokeDasharray={`${highArc} ${C - highArc}`}
                        strokeDashoffset={C}
                        transform="rotate(-90 32 32)"
                        className="animate-ring-draw"
                        style={{ '--ring-circumference': C, '--ring-offset': -(lowArc + midArc), animationDelay: '0.3s' } as React.CSSProperties}
                      />
                    </svg>
                    <div className="space-y-1">
                      {[
                        { label: 'Zone 1–2', pct: lowPct, ms: z.low, color: 'bg-[#444]' },
                        { label: 'Zone 3', pct: midPct, ms: z.mid, color: 'bg-[#777]' },
                        { label: 'Zone 4–5', pct: highPct, ms: z.high, color: 'bg-[#A78BCA]' },
                      ].map(({ label, pct, ms: zoneMs, color }, i) => (
                        <div key={label} className="text-[#999] font-light flex items-center gap-1.5 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${color} shrink-0`} />
                          {label}: {pct}% <span className="text-[#555] ml-1">{msToHours(zoneMs)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t sm:border-t-0 sm:border-l border-[#222] pt-3 sm:pt-0 sm:pl-3 space-y-1">
                    {Object.entries(
                      activities.reduce<Record<string, number>>((acc, w) => {
                        const sport = normalizeSport(w.sport_name)
                        const ms = new Date(w.end).getTime() - new Date(w.start).getTime()
                        acc[sport] = (acc[sport] ?? 0) + ms
                        return acc
                      }, {})
                    )
                      .sort(([, a], [, b]) => b - a)
                      .map(([sport, ms], i) => (
                        <div key={sport} className="text-[#999] font-light flex items-center gap-1.5 animate-fade-up" style={{ animationDelay: `${150 + i * 60}ms` }}>
                          <span className="shrink-0">{sportEmoji[sport] ?? '💪'}</span>
                          <span>{sport}</span>
                          <span className="text-[#555] ml-auto">{msToHours(ms)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )
          })()}
          <div className="space-y-2">
            {[...days].reverse().map((day, dayIndex) => (
              <div key={day.key} className="animate-fade-up" style={{ animationDelay: `${300 + dayIndex * 40}ms` }}>
                <p className="text-[#555] text-[10px] font-light mb-1">{day.label}</p>
                <div className="ml-2 mb-1">
                  <DailyMetricStrip day={day} />
                </div>
                {day.workouts.map(workout => (
                  <div key={`${workout.start}-${workout.sport_name}`} className="flex items-baseline justify-between text-[10px] ml-2">
                    <span className="text-[#999] font-light"><span className="grayscale">{sportEmoji[normalizeSport(workout.sport_name)] || '💪'}</span> {normalizeSport(workout.sport_name)}</span>
                    <span className="text-[#666] font-light">{formatMinutes(new Date(workout.end).getTime() - new Date(workout.start).getTime())} · {workout.score.average_heart_rate}bpm avg</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function WhoopStats({ data }: { data: WhoopData | null }) {
  const [activeMetric, setActiveMetric] = useState<WhoopMetric>('sleep')
  const [open, setOpen] = useState(false)

  if (!data) return <div className="h-[72px]" />

  const { recovery, sleep, cycle } = data.latest
  const historyDays = buildWhoopHistoryDays(data)
  const r = recovery.score
  const s = sleep.score
  const stages = s.stage_summary
  const totalSleep = stages.total_in_bed_time_milli - stages.total_awake_time_milli

  const fetchedDate = new Date(data.fetchedAt)
  const time = fetchedDate.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
  const date = fetchedDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  const formatted = `${time}, ${date}`

  const summaryLines = activeMetric === 'sleep'
    ? [
        `${msToHours(totalSleep)} total`,
        `REM ${msToHours(stages.total_rem_sleep_time_milli)}`,
        `deep ${msToHours(stages.total_slow_wave_sleep_time_milli)}`,
      ]
    : activeMetric === 'recovery'
      ? [
          `HRV ${r.hrv_rmssd_milli.toFixed(0)}ms`,
          `RHR ${r.resting_heart_rate}bpm`,
          `SpO2 ${r.spo2_percentage.toFixed(1)}%`,
        ]
      : cycle.score
        ? [
            `avg HR ${cycle.score.average_heart_rate}bpm`,
            `max HR ${cycle.score.max_heart_rate}bpm`,
            `${(cycle.score.kilojoule / 4.184).toFixed(0)} cal`,
          ]
        : []

  function handleMetricClick(metric: WhoopMetric) {
    if (open && activeMetric === metric) {
      setOpen(false)
      return
    }
    setActiveMetric(metric)
    setOpen(true)
  }

  return (
    <div className="animate-fade-in">
      <p className="text-[#555] text-[10px] font-light mb-3">whoop · last updated {formatted}</p>
      <div className="grid grid-cols-3 gap-4">
        <WhoopStat label="Sleep" value={`${s.sleep_performance_percentage}%`} active={open && activeMetric === 'sleep'} onClick={() => handleMetricClick('sleep')} />
        <WhoopStat label="Recovery" value={`${r.recovery_score}%`} active={open && activeMetric === 'recovery'} onClick={() => handleMetricClick('recovery')} />
        {cycle.score && (
          <WhoopStat label="Strain" value={cycle.score.strain.toFixed(1)} active={open && activeMetric === 'strain'} onClick={() => handleMetricClick('strain')} />
        )}
      </div>

      <WhoopHistoryPanel metric={activeMetric} open={open} days={historyDays} summaryLines={summaryLines} />
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

function App() {
  const whoopData = useWhoopData()

  return (
    <div className="max-w-[680px] mx-auto px-6 pt-6 pb-15">
      <header className="mb-8">
        <FadeIn>
          <h1 className="text-xl font-medium mb-1">Justin Phu</h1>
          <div className="flex gap-4 mt-1">
            <a href="mailto:justin@phu.dev" className="text-[#888] text-sm font-light no-underline transition-colors hover:text-[#e8e8e8]">justin@phu.dev</a>
          </div>
        </FadeIn>

        <FadeIn delay={100} className="mt-6">
          <WhoopStats data={whoopData} />
          {whoopData && <WhoopActivities data={whoopData} />}
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
                <li>running: sub 2hr half marathon <span className="text-[#555]">Feb '26</span></li>
                <li>triathlon: Western Sydney <ImageLink src="/half-ironman.jpg" alt="Western Sydney Half Ironman">Half Ironman</ImageLink> <span className="text-[#555]">May '26</span></li>
                <li>tennis: USTA 3.5
                  <p className="ml-4 text-[#666]">goal: best tennis player 65 years or older</p>
                </li>
            </ul>
            <p className="text-[#666] text-[10px] uppercase tracking-wider mt-5 mb-3">Upcoming</p>
            <div className="space-y-2">
              {[
                { name: 'Sydney Marathon', date: '2026-08-30', goal: 'sub 4 hour' },
                { name: 'Ironman Cozumel', date: '2026-11-22' },
              ].map(({ name, date, goal }) => {
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
                    {goal && <span className="text-[#666] text-[10px] font-light">goal: {goal}</span>}
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
              <li>29 chronological age, 21.6 whoop age</li>
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
