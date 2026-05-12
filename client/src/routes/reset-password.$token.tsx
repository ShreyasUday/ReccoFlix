import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Film, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { resetPassword } from "@/lib/api";

export const Route = createFileRoute("/reset-password/$token")({
  head: () => ({ meta: [{ title: "Reset Password — ReccoFlix" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useParams();
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid or expired token. Please request a new link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8 animate-fade-up">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
              <Film className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-gradient-primary">RECCOFLIX</span>
          </Link>
          <h1 className="mt-8 text-3xl font-extrabold">Set new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your new password must be different from previously used passwords.
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl glass p-8 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success shadow-glow-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Password reset successful</h3>
              <p className="mt-2 text-sm text-muted-foreground">You can now sign in with your new password.</p>
            </div>
            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow transition-smooth hover:scale-[1.01]"
            >
              Sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="text-sm font-semibold text-destructive text-center">{error}</div>}
            
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  New Password
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-background/40 px-3 py-2.5 transition-smooth focus-within:border-primary/60 focus-within:shadow-glow">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type={show ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShow((s) => !s)} className="text-muted-foreground hover:text-foreground">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Confirm Password
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-background/40 px-3 py-2.5 transition-smooth focus-within:border-primary/60 focus-within:shadow-glow">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type={show ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow transition-smooth hover:scale-[1.01] disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
