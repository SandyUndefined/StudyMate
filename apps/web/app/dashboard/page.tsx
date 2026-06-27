'use client'

// Placeholder data for Phase 1 — real data wired in Phase 3 (Efficiency/Analytics)
const MOCK_MOOD_TREND = [
  { date: 'Jun 21', energy: 6, anxiety: 7, motivation: 5, composite: 4.7 },
  { date: 'Jun 22', energy: 7, anxiety: 6, motivation: 6, composite: 5.7 },
  { date: 'Jun 23', energy: 5, anxiety: 8, motivation: 4, composite: 3.7 },
  { date: 'Jun 24', energy: 6, anxiety: 6, motivation: 7, composite: 5.7 },
  { date: 'Jun 25', energy: 7, anxiety: 5, motivation: 8, composite: 6.7 },
  { date: 'Jun 26', energy: 8, anxiety: 4, motivation: 8, composite: 7.3 },
  { date: 'Jun 27', energy: 7, anxiety: 5, motivation: 7, composite: 6.3 },
]

const MOCK_TRIGGERS = [
  { topic: 'Organic Chemistry', occurrences: 6, sentiment: -0.7 },
  { topic: 'Mock test scores', occurrences: 4, sentiment: -0.6 },
  { topic: 'Parents', occurrences: 3, sentiment: -0.4 },
  { topic: 'Sleep', occurrences: 3, sentiment: -0.5 },
]

const MOCK_RESILIENCE = {
  score: 68,
  trend: 'improving' as const,
  averageDaysToRecovery: 1.2,
}

const MOCK_WEEKLY_INSIGHT =
  'This week you showed real resilience — your anxiety score dropped 20% compared to last week, even through a tough mock test cycle. Organic Chemistry keeps coming up; it might be worth a conversation with Mitra about how that subject makes you feel, separate from your scores.'

function ResilienceGauge({ score, trend }: { score: number; trend: string }) {
  const trendColor = trend === 'improving' ? 'text-green-600' : trend === 'declining' ? 'text-red-500' : 'text-slate-500'
  const trendLabel = trend === 'improving' ? 'Improving' : trend === 'declining' ? 'Declining' : 'Stable'

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100">
      <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">Resilience Score</h2>
      <div className="flex items-end gap-3">
        <span className="text-5xl font-bold text-indigo-600" aria-label={`Resilience score: ${score} out of 100`}>
          {score}
        </span>
        <span className="text-slate-400 text-lg mb-1">/100</span>
        <span className={`ml-auto text-sm font-medium ${trendColor}`} aria-label={`Trend: ${trendLabel}`}>
          {trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→'} {trendLabel}
        </span>
      </div>
      <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${score}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Resilience ${score}%`}
        />
      </div>
    </div>
  )
}

function MoodChart() {
  const maxComposite = 10

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100">
      <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
        Wellbeing This Week
      </h2>
      <div className="flex items-end gap-2 h-32" aria-label="Mood chart for the past 7 days" role="img">
        {MOCK_MOOD_TREND.map((day) => (
          <div key={day.date} className="flex flex-col items-center flex-1 gap-1">
            <div
              className="w-full bg-indigo-500 rounded-t-sm transition-all"
              style={{ height: `${(day.composite / maxComposite) * 100}%`, minHeight: 4 }}
              aria-label={`${day.date}: wellbeing ${day.composite}/10`}
            />
            <span className="text-xs text-slate-400 truncate w-full text-center">{day.date.split(' ')[1]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TriggerList() {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100">
      <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
        What&apos;s Been Heavy (30 days)
      </h2>
      <ul className="space-y-3" aria-label="Top stress triggers">
        {MOCK_TRIGGERS.map((trigger) => (
          <li key={trigger.topic} className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-slate-700 text-sm font-medium">{trigger.topic}</p>
              <p className="text-xs text-slate-400">Mentioned {trigger.occurrences}× this month</p>
            </div>
            <div
              className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden"
              aria-hidden="true"
            >
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${Math.abs(trigger.sentiment) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-slate-800">Your Insights</h1>
        <p className="text-sm text-slate-400 mt-0.5">Private · Updated daily</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <ResilienceGauge score={MOCK_RESILIENCE.score} trend={MOCK_RESILIENCE.trend} />
        <MoodChart />
        <TriggerList />

        {/* Weekly AI insight */}
        <section className="bg-indigo-50 rounded-xl p-5 border border-indigo-100" aria-labelledby="weekly-insight-heading">
          <h2 id="weekly-insight-heading" className="text-sm font-medium text-indigo-600 uppercase tracking-wide mb-3">
            Mitra&apos;s Weekly Reflection
          </h2>
          <p className="text-slate-700 text-sm leading-relaxed">{MOCK_WEEKLY_INSIGHT}</p>
        </section>

        <p className="text-xs text-center text-slate-400 py-2">
          All insights are generated from your entries · No one else can see this
        </p>
      </div>
    </div>
  )
}
