import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Background } from "./Background"
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle2, Star } from "lucide-react"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)
    setShowSignupSuccess(false)

    try {
      if (mode === "signup") {
        // 1. Sign up the user in Supabase Auth
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

        if (authError) throw authError

        // 2. Store additional profile data in the "profiles" table
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

        // 🔄 Switch to Sign In page after account creation
        setShowSignupSuccess(true)
        onToggle()
      } else {
        // Sign in only via Email (Gmail)
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

  // Gmail Validation Logic
  const emailError = useMemo(() => {
    if (!formData.email) return null
    if (formData.email.includes("@") && !formData.email.endsWith("@gmail.com")) {
      return "Please enter a valid Gmail address."
    }
    return null
  }, [formData.email])

  // Password Strength Logic
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

  const strengthColor = ["bg-gray-100", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"][passwordStrength]
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
      <div className="w-full max-w-[440px] mx-auto px-4 text-[#171717]">
        <Card className="border border-gray-100 rounded-2xl bg-white overflow-hidden p-8 md:p-9">
          {/* Header & Global Errors */}
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-[#171717] shadow-xl">
              <Star 
                className="w-8 h-8 text-white fill-white animate-logo-float" 
                style={{ animationDuration: '6s' }}
              />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
                {mode === "login" ? "Welcome back" : "Get started"}
              </h1>
              <p className="text-sm text-[#8E8E8E] font-medium leading-relaxed">
                {mode === "login"
                  ? "Happy to see you again."
                  : "A simpler way to manage your wealth."}
              </p>
            </div>
          </div>

          {(verificationSuccess || showSignupSuccess) && mode === "login" && !errorMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm font-semibold text-green-800">
                {showSignupSuccess ? "Account created! Start your journey" : "Email verified! Please sign in below."}
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-800 leading-tight">{errorMsg}</p>
            </div>
          )}

          {/* Form - Compact & Direct */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-semibold text-[#171717] ml-0.5">Full name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-gray-200 bg-white focus:ring-0 focus:border-[#171717] transition-all rounded-lg h-11 px-4 text-sm"
                  placeholder="Full name"
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <Label htmlFor="email" className="text-sm font-semibold text-[#171717]">Email address</Label>
                {emailError && (
                  <span className="text-[12px] font-medium text-red-500/80 flex items-center gap-1 transition-all">
                    <AlertCircle className="w-3 h-3" /> {emailError}
                  </span>
                )}
              </div>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`transition-all rounded-lg h-11 px-4 text-sm ${emailError
                  ? "border-red-100 bg-red-50/10 focus:border-red-300"
                  : "border-gray-200 bg-white focus:ring-0 focus:border-[#171717]"
                  }`}
                placeholder="Email address"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5 relative">
              <div className="flex items-center justify-between px-0.5">
                <Label htmlFor="password" className="text-sm font-semibold text-[#171717]">Password</Label>
                {mode === "login" ? (
                  <button type="button" className="text-sm font-bold text-[#171717] hover:underline" disabled={isLoading}>Forgot password?</button>
                ) : (
                  <span className={`text-[12px] font-bold transition-colors ${passwordStrength >= 3 ? "text-green-600" : "text-[#B5B5B5]"
                    }`}>
                    {strengthText}
                  </span>
                )}
              </div>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="border-gray-200 bg-white focus:ring-0 focus:border-[#171717] transition-all rounded-lg h-11 px-4 pr-12 text-sm"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#171717] transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength Indicator Bar */}
              {mode === "signup" && (
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${strengthColor}`}
                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5 relative">
                <div className="flex items-center justify-between px-0.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[#171717]">Verify password</Label>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <span className="text-[12px] font-medium text-red-500/80 flex items-center gap-1 transition-all">
                      <AlertCircle className="w-3 h-3" /> Passwords do not match.
                    </span>
                  )}
                </div>
                <div className="relative group">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`transition-all rounded-lg h-11 px-4 pr-12 text-sm ${formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? "border-red-100 bg-red-50/10 focus:border-red-300"
                      : "border-gray-200 bg-white focus:ring-0 focus:border-[#171717]"
                      }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#171717] transition-colors"
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
              className="w-full bg-[#171717] hover:bg-[#262626] text-white font-bold h-11 rounded-lg shadow-xl transition-all text-sm mt-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                mode === "login" ? "Sign in" : "Create account"
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-8">
            <p className="text-sm text-[#8E8E8E] font-medium leading-relaxed">
              {mode === "login"
                ? "Don't have an account yet?"
                : "Already using our app?"}{" "}
              <button
                onClick={onToggle}
                className="text-[#171717] font-bold hover:underline transition-all ml-1"
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
