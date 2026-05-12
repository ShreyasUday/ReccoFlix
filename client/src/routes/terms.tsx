import { createFileRoute } from "@tanstack/react-router";
import { Scale, CheckCircle2, AlertCircle, UserCheck, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — ReccoFlix" }] }),
  component: TermsPage,
});

function TermsPage() {
  const clauses = [
    {
      title: "Acceptance of Terms",
      icon: CheckCircle2,
      content: "By accessing and using ReccoFlix, you agree to comply with and be bound by these Terms of Service. If you do not agree, please refrain from using the platform."
    },
    {
      title: "User Conduct",
      icon: UserCheck,
      content: "You agree to use ReccoFlix for personal, non-commercial purposes. Any attempt to scrape data, disrupt services, or bypass security features is strictly prohibited."
    },
    {
      title: "Account Responsibility",
      icon: ShieldAlert,
      content: "You are responsible for maintaining the confidentiality of your account credentials. ReccoFlix is not liable for any loss resulting from unauthorized access to your account."
    },
    {
      title: "Content Accuracy",
      icon: AlertCircle,
      content: "While we strive for accuracy, ReccoFlix depends on third-party data providers. We do not guarantee the absolute correctness or completeness of anime metadata or release dates."
    }
  ];

  return (
    <div className="mx-auto max-w-3xl py-10 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: May 12, 2026</p>
      </div>

      <div className="glass rounded-3xl p-8 sm:p-12 space-y-8">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Legal Agreement</h2>
            <p className="text-sm text-muted-foreground">Standard terms for using the ReccoFlix platform.</p>
          </div>
        </div>

        <div className="space-y-10">
          {clauses.map((c) => (
            <div key={c.title} className="space-y-4">
              <div className="flex items-center gap-3">
                <c.icon className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">{c.title}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                {c.content}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-pink/20 bg-pink/5 p-6 space-y-2">
          <h4 className="font-bold text-sm text-pink uppercase tracking-widest">Disclaimer</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            ReccoFlix provides services "as is" without any express or implied warranties. 
            We reserve the right to modify or terminate services at any time for any reason.
          </p>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Need clarification? Contact our legal team at <a href="mailto:legal@reccoflix.com" className="text-primary hover:underline">legal@reccoflix.com</a>
      </div>
    </div>
  );
}
