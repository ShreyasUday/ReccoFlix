import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Film, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getAuthURL } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — ReccoFlix" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
   const { login } = useAuth();
  const navigate = useNavigate();

  const authBg = React.useMemo(() => {
    const backgrounds = [
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg", // JJK
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg", // One Piece
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg", // AOT
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg", // Demon Slayer
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png", // Solo Leveling
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-DdP4vAdssLoz.png", // Chainsaw Man
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21519-SUo3ZQuCbYhJ.png", // Your Name
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1735-kGfVm0YqCPcu.png", // Naruto
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx116674-p3zK4PUX2Aag.jpg", // Bleach
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx150672-WqmmwZ4nMzAy.png", // Oshi No Ko
    ];
    return backgrounds[Math.floor(Math.random() * backgrounds.length)];
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden lg:grid lg:grid-cols-2">
      {/* Left visual */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={authBg}
          alt=""
          className="h-full w-full object-cover transition-transform duration-[10000ms] hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/40 to-accent/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        {/* Right edge fade for smooth merge */}
        <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-r from-transparent to-background hidden lg:block" />

        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
              <Film className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-gradient-primary">RECCOFLIX</span>
          </Link>

          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold leading-tight text-foreground">
              Your <span className="text-gradient-primary">anime universe</span>,<br /> personalized.
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              AI-powered recommendations · cinematic library tracking · 50,000+ anime curated for you.
            </p>
            <div className="flex gap-2 text-xs">
              {["MAPPA", "ufotable", "Madhouse", "Wit Studio"].map((s) => (
                <span key={s} className="rounded-full glass px-3 py-1">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="relative flex min-h-[100dvh] items-center justify-center px-6 py-12 sm:px-12 lg:min-h-0">
        <div className="w-full max-w-md space-y-7">
          <div className="lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
                <Film className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-gradient-primary">RECCOFLIX</span>
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to continue your journey.</p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            {error && <div className="text-sm font-semibold text-destructive">{error}</div>}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-background/40 px-3 py-2.5 transition-smooth focus-within:border-primary/60 focus-within:shadow-glow">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="flex-1 bg-transparent text-sm focus:outline-none" />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                <Link to="/forgot-password" size="sm" className="text-xs text-primary hover:underline">Forgot?</Link>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-background/40 px-3 py-2.5 transition-smooth focus-within:border-primary/60 focus-within:shadow-glow">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input type={show ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="flex-1 bg-transparent text-sm focus:outline-none" />
                <button type="button" onClick={() => setShow((s) => !s)} className="text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>


            <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-glow transition-smooth hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
              {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-white/10" />
            OR CONTINUE WITH
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <a href={getAuthURL("google")} className="rounded-xl glass-strong flex items-center justify-center py-3 text-sm font-semibold transition-smooth hover:bg-white/10">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </a>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            New to ReccoFlix? <Link to="/signup" className="font-bold text-primary hover:underline">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
