import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">StudyMate</h1>
          <p className="text-lg text-slate-500">
            Your mental game is your competitive advantage.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6 text-left">
          <p className="text-slate-600 text-sm leading-relaxed">
            Built for JEE, NEET, UPSC, CAT &amp; GATE aspirants. Journal privately, track your
            mood in three dimensions, and talk to Mitra — your AI companion — anytime.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/onboarding"
            className="block w-full py-4 px-6 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="block w-full py-4 px-6 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-colors"
          >
            Log In
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          100% private · End-to-end encrypted · No parent or institute access
        </p>
      </div>
    </div>
  )
}
