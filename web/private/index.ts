// Extension point for private/org-only code. Empty in the open-source build;
// a deployment may replace this directory with its own registry.
import type { LucideIcon } from "lucide-react";
export type PrivateNavItem = { href: string; label: string; icon: LucideIcon };
export const privateNav: PrivateNavItem[] = [];
