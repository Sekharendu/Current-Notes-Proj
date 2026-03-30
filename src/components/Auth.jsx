import { supabase } from '../supabaseClient'
import { KiroBitLogo } from './KiroBitLogo'

export function Auth() {
  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  const handleGithub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin }
    })
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(16, 185, 129, 0.08), transparent 55%), #0f0f0f',
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          background: '#1a1a1a',
          border: '1px solid rgba(16, 185, 129, 0.18)',
          boxShadow: '0 0 0 1px rgba(16, 185, 129, 0.06), 0 25px 50px -12px rgba(0, 0, 0, 0.55)',
        }}
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <span
            className="inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border p-1"
            style={{
              borderColor: 'rgba(16, 185, 129, 0.35)',
              background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.12) 0%, rgba(26, 26, 26, 0.9) 100%)',
            }}
            aria-hidden
          >
            <KiroBitLogo variant="minimal" size="xs" />
          </span>
          <div className="text-center">
            <h1 className="text-xl font-semibold" style={{ color: '#e8e8e8' }}>
              Welcome to{' '}
              <span style={{ color: '#34d399' }}>Notes</span>
            </h1>
            <div className="mx-auto mt-2 h-0.5 w-10 rounded-full" style={{ background: 'rgba(52, 211, 153, 0.45)' }} />
            <p className="mt-3 text-sm" style={{ color: '#6b7280' }}>
              Sign in to your personal workspace
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer"
            style={{ background: '#232323', border: '1px solid rgba(16, 185, 129, 0.12)', color: '#c9c9c9' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'
              e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#232323'
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.12)'
            }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={handleGithub}
            className="flex w-full items-center justify-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer"
            style={{ background: '#232323', border: '1px solid rgba(16, 185, 129, 0.12)', color: '#c9c9c9' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'
              e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#232323'
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.12)'
            }}
          >
            <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: '#525252' }}>
          By signing in, you agree to our terms of service
        </p>
      </div>
    </div>
  )
}