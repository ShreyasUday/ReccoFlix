import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AppShell } from "@/components/app-shell";
import { LibraryProvider } from "@/lib/library-context";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-8xl font-extrabold text-gradient-primary">404</h1>
        <h2 className="mt-4 text-2xl font-bold">Lost in the multiverse</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page drifted off into another dimension. Let's get you back home.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">Something glitched</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message || "Try refreshing — sometimes that fixes it."}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
          >
            Try again
          </button>
          <a href="/" className="rounded-full glass-strong px-5 py-2.5 text-sm font-semibold">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ReccoFlix — Premium Anime Discovery" },
      { name: "description", content: "Discover, track, and obsess over anime. AI-powered recommendations, beautiful library tracking, cinematic discovery." },
      { name: "author", content: "ReccoFlix" },
      { property: "og:title", content: "ReccoFlix — Premium Anime Discovery" },
      { property: "og:description", content: "AI-powered anime recommendations and tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NO_SHELL_ROUTES = ["/login", "/signup", "/forgot-password"];

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const noShell = NO_SHELL_ROUTES.includes(pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LibraryProvider>
          {noShell ? <Outlet /> : <AppShell><Outlet /></AppShell>}
          <Toaster position="top-center" richColors theme="dark" />
        </LibraryProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
