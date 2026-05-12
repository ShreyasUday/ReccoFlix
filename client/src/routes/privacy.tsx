import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Lock, Eye, Database, Share2, FileText } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — ReccoFlix" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const sections = [
    {
      title: "Data Collection",
      icon: Database,
      content: "We collect minimal information required to provide our services, including your email address for authentication and your anime library data for recommendations."
    },
    {
      title: "Account Security",
      icon: Lock,
      content: "Your passwords are encrypted using industry-standard bcrypt hashing. We never store plain-text passwords and use secure sessions for all authenticated requests."
    },
    {
      title: "Third-Party APIs",
      icon: Share2,
      content: "We use the Kitsu API to fetch anime metadata. Your library data is stored on our private PostgreSQL database and is never sold or shared with external marketing parties."
    },
    {
      title: "AI Personalization",
      icon: ShieldCheck,
      content: "Our AI recommendation engine processes your public anime library to generate suggestions. This analysis is performed locally on our infrastructure to protect your privacy."
    }
  ];

  return (
    <div className="mx-auto max-w-3xl py-10 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: May 12, 2026</p>
      </div>

      <div className="glass rounded-3xl p-8 sm:p-12 space-y-8">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Our Commitment</h2>
            <p className="text-sm text-muted-foreground">Transparency and security are at the core of ReccoFlix.</p>
          </div>
        </div>

        <div className="space-y-10">
          {sections.map((s) => (
            <div key={s.title} className="space-y-4">
              <div className="flex items-center gap-3">
                <s.icon className="h-5 w-5 text-accent" />
                <h3 className="font-bold text-lg">{s.title}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {s.content}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white/5 p-6 border border-white/5 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest text-primary">
            <FileText className="h-4 w-4" /> Your Rights
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You have the right to access, correct, or delete your personal data at any time. 
            You can manage your library and account settings through your profile dashboard, 
            or contact us for full account deletion.
          </p>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Questions about our privacy? Reach out at <a href="mailto:privacy@reccoflix.com" className="text-primary hover:underline">privacy@reccoflix.com</a>
      </div>
    </div>
  );
}
