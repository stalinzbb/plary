import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AppTabsShell } from "@/components/app-tabs-shell";
import { ScrollToTop } from "@/components/scroll-to-top";
import { NewLoginBanner } from "@/components/new-login-banner";
import { FigmaReconnectBanner } from "@/components/figma-reconnect-banner";

export default async function AppLayout({
  children,
  library,
  collections,
  settings,
}: {
  children: React.ReactNode;
  library: React.ReactNode;
  collections: React.ReactNode;
  settings: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";
  const newLoginDetected = headerList.get("x-new-login-detected") === "true";

  if (pathname === "/") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return <>{children}</>;
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <AppTabsShell
          library={library}
          collections={collections}
          settings={settings}
        >
          {children}
        </AppTabsShell>
      </div>
      <ScrollToTop />
      <NewLoginBanner detected={newLoginDetected} />
      <FigmaReconnectBanner />
    </div>
  );
}
