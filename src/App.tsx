import { useState, useEffect } from 'react'
import { AuthPage } from './components/auth/AuthPage'
import { OnboardingChoice } from './components/onboarding/OnboardingChoice'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLogin, setIsLogin] = useState(true)
  const [verificationSuccess, setVerificationSuccess] = useState(false)
  const [userChoice, setUserChoice] = useState<'portfolio' | 'expense' | 'profile' | null>(null)

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Switch to sign-in mode if redirected from email verification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'login') {
      setIsLogin(true);
      setVerificationSuccess(true);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUserChoice(null)
  }

  // Render Logic
  if (session) {
    if (!userChoice) {
      return (
        <OnboardingChoice 
          onSelect={setUserChoice}
        />
      )
    }

    // This is where the actual Portfolio or Expense dashboards will go
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-6">
        <h1 className="text-4xl font-bold text-[#171717]">
          Welcome to the {userChoice} module
        </h1>
        <p className="text-gray-500 max-w-md">
          Implementation of the full {userChoice} module is coming next. You are securely logged in as {session.user.email}
        </p>
        <button 
          onClick={() => setUserChoice(null)}
          className="text-sm font-bold text-gray-400 hover:text-[#171717] transition-colors underline"
        >
          Back to Selection
        </button>
        <button 
          onClick={handleLogout}
          className="px-6 py-2 bg-[#171717] text-white rounded-lg font-bold hover:bg-[#262626] transition-all"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <AuthPage 
        mode={isLogin ? 'login' : 'signup'} 
        onToggle={() => setIsLogin(!isLogin)}
        verificationSuccess={verificationSuccess}
      />
    </div>
  )
}

export default App
