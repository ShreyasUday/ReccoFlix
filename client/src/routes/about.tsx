import { createFileRoute, Link } from "@tanstack/react-router";
import { Film, Sparkles, Heart, Globe, Github, Mail, ArrowRight, Compass } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — ReccoFlix" }] }),
  component: AboutPage,
});

function AboutPage() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="mx-auto max-w-4xl space-y-16 py-10">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-primary shadow-glow">
            <Film className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
          The next generation of <br />
          <span className="text-gradient-primary">anime discovery.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
          ReccoFlix is a high-performance, AI-driven platform built for the modern otaku. 
          We combine cinematic aesthetics with advanced recommendation algorithms to help you 
          build the ultimate library.
        </p>
      </section>

      {/* Features Grid */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="glass rounded-3xl p-8 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">AI Recommendations</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our neural engine analyzes your library and watch history to suggest titles that 
            genuinely match your taste, moving beyond simple genre matching.
          </p>
        </div>
        
        <div className="glass rounded-3xl p-8 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
            <Globe className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">Global Database</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Connected to the Kitsu API, we offer a massive catalog of over 50,000 titles with 
            real-time updates on airing status and episode counts.
          </p>
        </div>

        <div className="glass rounded-3xl p-8 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-pink/10 flex items-center justify-center text-pink">
            <Heart className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">Cinematic Library</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Organize your collection with a beautiful, responsive interface that tracks 
            what you're watching, what you've finished, and your personal favorites.
          </p>
        </div>

        <div className="glass rounded-3xl p-8 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-cyan/10 flex items-center justify-center text-cyan">
            <Film className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">HD Visual Library</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Experience anime like never before with high-resolution key visuals and 
            smooth, modern transitions across all your devices.
          </p>
        </div>
      </section>

      {/* Vision Section */}
      <section className="glass rounded-[2rem] p-10 text-center space-y-8 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-extrabold">Our Vision</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground leading-relaxed">
            We believe that every anime is a doorway to a new world. Our mission is to build 
            the most intuitive bridge between you and your next obsession. ReccoFlix isn't just 
            a tracker; it's a celebration of storytelling, artistry, and the community that 
            breathes life into these characters.
          </p>
          <div className="pt-4 flex flex-col items-center gap-4">
            <a 
              href="https://github.com/ShreyasUday/ReccoFlix" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary-glow transition-smooth"
            >
              Support the Project on GitHub <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="text-center py-10 space-y-6">
        <h2 className="text-3xl font-extrabold">
          {isAuthenticated ? "Continue your adventure." : "Ready to start your journey?"}
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {isAuthenticated ? (
            <Link to="/browse" className="flex items-center gap-2 rounded-full bg-gradient-primary px-8 py-3 font-bold text-primary-foreground shadow-glow transition-smooth hover:scale-105">
              Browse Anime <Compass className="h-5 w-5" />
            </Link>
          ) : (
            <Link to="/signup" className="flex items-center gap-2 rounded-full bg-gradient-primary px-8 py-3 font-bold text-primary-foreground shadow-glow transition-smooth hover:scale-105">
              Create Account <ArrowRight className="h-5 w-5" />
            </Link>
          )}
          <a href="mailto:contact@reccoflix.com" className="flex items-center gap-2 rounded-full glass-strong px-8 py-3 font-bold hover:bg-white/10 transition-smooth">
            Contact Support <Mail className="h-5 w-5" />
          </a>
        </div>
      </section>
    </div>
  );
}
