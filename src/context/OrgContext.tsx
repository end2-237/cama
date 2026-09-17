"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { applyTheme } from "@/lib/theme";
import { hasFeature, type FeatureKey } from "@/lib/features";
import {
  DBOrganization, FALLBACK_ORGS, DEFAULT_ORG_SLUG,
  resolveOrgSlug, fetchOrgBySlug,
} from "@/lib/org";

interface OrgCtx {
  org: DBOrganization;
  loading: boolean;
  reload: () => void;
  has: (key: FeatureKey) => boolean;
}

const OrgContext = createContext<OrgCtx | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  // Rendu initial déterministe (SSR + 1er paint) : JFN par défaut.
  const [org, setOrg] = useState<DBOrganization>(FALLBACK_ORGS[DEFAULT_ORG_SLUG]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const slug = resolveOrgSlug();
    // Applique aussitôt le fallback (couleurs immédiates, sans attendre la DB)
    const fb = FALLBACK_ORGS[slug] ?? FALLBACK_ORGS[DEFAULT_ORG_SLUG];
    setOrg(fb);
    applyTheme(document.documentElement, fb.primary_color, fb.accent_color);

    (async () => {
      const fresh = await fetchOrgBySlug(slug);
      if (cancelled) return;
      setOrg(fresh);
      applyTheme(document.documentElement, fresh.primary_color, fresh.accent_color);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tick]);

  return (
    <OrgContext.Provider value={{ org, loading, reload: () => setTick((t) => t + 1), has: (k) => hasFeature(org, k) }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg(): OrgCtx {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg doit être utilisé dans <OrgProvider>");
  return ctx;
}
