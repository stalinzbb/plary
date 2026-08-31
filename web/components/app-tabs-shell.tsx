"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type AppTabsShellProps = {
  children: React.ReactNode;
  library: React.ReactNode;
  collections: React.ReactNode;
  settings: React.ReactNode;
};

function isTabRoute(pathname: string) {
  return pathname === "/" || pathname === "/collections" || pathname === "/settings";
}

function activeTab(pathname: string) {
  if (pathname === "/settings") return "settings";
  if (pathname.startsWith("/collections")) return "collections";
  return "library";
}

export function AppTabsShell({
  children,
  library,
  collections,
  settings,
}: AppTabsShellProps) {
  const pathname = usePathname();
  const tab = activeTab(pathname);
  const showTabs = isTabRoute(pathname);

  return (
    <>
      <div className={cn(!showTabs && "hidden")}>
        <div className={cn(tab !== "library" && "hidden")}>{library}</div>
        <div className={cn(tab !== "collections" && "hidden")}>{collections}</div>
        <div className={cn(tab !== "settings" && "hidden")}>{settings}</div>
      </div>
      <div className={cn(showTabs && "hidden")}>{children}</div>
    </>
  );
}
