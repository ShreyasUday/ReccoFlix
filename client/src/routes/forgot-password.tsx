import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Film, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "@/lib/api";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot Password — ReccoFlix" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await forgotPassword(email);
      setMessage(res.message || "If an account exists, instructions have been sent.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
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
          <h1 className="mt-8 text-3xl font-extrabold">Forgot password?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        {message ? (
          <div className="rounded-2xl glass p-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">{message}</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="text-sm font-semibold text-destructive text-center">{error}</div>}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email address
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-background/40 px-3 py-2.5 transition-smooth focus-within:border-primary/60 focus-within:shadow-glow">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow transition-smooth hover:scale-[1.01] disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset password"}
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-smooth"
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
