import { useState, useMemo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Background } from "./Background"
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle2, Zap } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface AuthPageProps {
  mode: "login" | "signup"
  onToggle: () => void
  verificationSuccess?: boolean
}

export const AuthPage = ({ mode, onToggle, verificationSuccess }: AuthPageProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "", 
    password: "",
    confirmPassword: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showSignupSuccess, setShowSignupSuccess] = useState(false)

  useEffect(() => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    })
    setErrorMsg(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }, [mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)
    setShowSignupSuccess(false)

    try {
      if (mode === "signup") {
        localStorage.setItem('signup_in_progress', 'true')
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/?mode=login`,
            data: {
              full_name: formData.name,
            },
          },
        })

        if (authError) {
          localStorage.removeItem('signup_in_progress')
          throw authError
        }

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              full_name: formData.name,
              email: formData.email,
              updated_at: new Date().toISOString(),
            })

          if (profileError) {
            console.warn("Database storage failed, but auth was successful.", profileError.message)
          }
        }

        await supabase.auth.signOut()
        localStorage.removeItem('signup_in_progress')
        setShowSignupSuccess(true)
        onToggle()
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        if (error) throw error
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  const emailError = useMemo(() => {
    if (!formData.email) return null
    if (formData.email.includes("@") && !formData.email.endsWith("@gmail.com")) {
      return "Please enter a valid Gmail address."
    }
    return null
  }, [formData.email])

  const passwordStrength = useMemo(() => {
    const pwd = formData.password
    if (!pwd) return 0
    let score = 0
    if (pwd.length >= 8) score += 1
    if (/[A-Z]/.test(pwd)) score += 1
    if (/[a-z]/.test(pwd)) score += 1
    if (/[0-9]/.test(pwd) || /[^A-Z0-9]/i.test(pwd)) score += 1
    return score
  }, [formData.password])

  const strengthText = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength]

  const isFormValid = useMemo(() => {
    const { name, email, password, confirmPassword } = formData
    const isGmail = email.endsWith("@gmail.com") && email.includes("@")

    if (mode === "login") {
      return isGmail && password.length > 0
    } else {
      const passwordsMatch = password === confirmPassword
      return name.length > 0 && isGmail && password.length >= 8 && passwordsMatch
    }
  }, [formData, mode])

  return (
    <Background>
      <div className="w-full max-w-[520px] mx-auto px-4 text-[#111827] font-sans">
        <Card className="border-t-[6px] border-t-indigo-500 border border-[#E5E7EB] rounded-2xl bg-white p-8 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-3 mb-7">
            <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#111827] text-white shadow-sm">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-[#111827]">
                {mode === "login" ? "Welcome back" : "Get started"}
              </h1>
              <p className="text-xs text-[#6B7280] font-medium">
                {mode === "login"
                  ? "Sign in to your personal financial workspace."
                  : "A simpler way to manage your portfolio and expenses."}
              </p>
            </div>
          </div>

          {(verificationSuccess || showSignupSuccess) && mode === "login" && !errorMsg && (
            <div className="mb-5 p-3.5 bg-[#F4F5F7] border border-[#E5E7EB] rounded-xl flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs font-medium text-[#111827]">
                {showSignupSuccess ? "Account created! Please sign in." : "Email verified! Please sign in below."}
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-[#F4F5F7] border border-[#E5E7EB] rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-[#111827] leading-tight">{errorMsg}</p>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Email address</Label>
                {emailError && (
                  <span className="text-[11px] font-medium text-rose-600 flex items-center gap-1 mb-1.5">
                    <AlertCircle className="w-3 h-3" /> {emailError}
                  </span>
                )}
              </div>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@gmail.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "login" ? (
                  <button type="button" className="text-xs font-medium text-[#6B7280] hover:text-[#111827] transition-colors mb-1.5" disabled={isLoading}>
                    Forgot password?
                  </button>
                ) : (
                  <span className="text-[11px] font-medium text-[#6B7280] mb-1.5">
                    {strengthText}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] transition-colors p-1"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === "signup" && (
                <div className="h-1 w-full bg-[#F4F5F7] rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-[#111827] transition-all duration-300 rounded-full"
                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {mode === "signup" && (
              <div>
                <Label htmlFor="confirmPassword">Verify password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors p-1"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full bg-[#111827] hover:bg-[#1F2937] text-white font-medium h-11 rounded-xl transition-all text-sm mt-3 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.06)] active:scale-[0.99]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                mode === "login" ? "Sign in" : "Create account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-[#E5E7EB] pt-5">
            <p className="text-xs text-[#6B7280] font-medium">
              {mode === "login"
                ? "Don't have an account yet?"
                : "Already using our workspace?"}{" "}
              <button
                onClick={onToggle}
                className="text-[#111827] font-semibold hover:underline ml-0.5"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </Card>
      </div>
    </Background>
  )
}
