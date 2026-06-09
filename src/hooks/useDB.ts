"use client";

import { useEffect, useState, useCallback } from "react";
import { loadDB, saveDB } from "@/lib/db";

type DB = ReturnType<typeof loadDB>;

/** Hook réactif sur la BD localStorage : relit à chaque mutation (event "cama-db"). */
export function useDB() {
  const [db, setDb] = useState<DB | null>(null);

  useEffect(() => {
    setDb(loadDB());
    const fn = () => setDb(loadDB());
    window.addEventListener("cama-db", fn);
    window.addEventListener("storage", fn);
    return () => {
      window.removeEventListener("cama-db", fn);
      window.removeEventListener("storage", fn);
    };
  }, []);

  const mutate = useCallback((fn: (db: DB) => void) => {
    const cur = loadDB();
    fn(cur);
    saveDB(cur);
  }, []);

  return { db, mutate };
}
