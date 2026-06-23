// Exécution de code réelle via l'API publique Piston (gratuite, sans auth).
// Tourne côté navigateur — 60+ langages dans des conteneurs isolés.
const PISTON = "https://emkc.org/api/v2/piston";

export interface Runtime {
  language: string;
  version: string;
  aliases: string[];
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  output: string;
  code: number | null;
  signal: string | null;
}

let cachedRuntimes: Runtime[] | null = null;

export async function fetchRuntimes(): Promise<Runtime[]> {
  if (cachedRuntimes) return cachedRuntimes;
  const res = await fetch(`${PISTON}/runtimes`);
  if (!res.ok) throw new Error("Impossible de charger les langages disponibles.");
  cachedRuntimes = (await res.json()) as Runtime[];
  return cachedRuntimes;
}

export async function executeCode(opts: {
  language: string;
  version: string;
  content: string;
  stdin?: string;
  filename?: string;
}): Promise<ExecResult> {
  const res = await fetch(`${PISTON}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: opts.language,
      version: opts.version,
      files: [{ name: opts.filename ?? "main", content: opts.content }],
      stdin: opts.stdin ?? "",
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Erreur d'exécution (${res.status}). ${txt}`);
  }
  const data = await res.json();
  const run = data.run ?? data.compile ?? {};
  return {
    stdout: run.stdout ?? "",
    stderr: run.stderr ?? "",
    output: run.output ?? "",
    code: run.code ?? null,
    signal: run.signal ?? null,
  };
}

// Langages mis en avant + templates de démarrage
export interface LangChoice {
  id: string;          // identifiant Piston (language)
  label: string;
  monaco: string;      // langage Monaco pour la coloration
  filename: string;
  template: string;
}

export const LANGS: LangChoice[] = [
  {
    id: "python", label: "Python", monaco: "python", filename: "main.py",
    template: `# TP — écrivez votre solution ici\n\ndef somme(a, b):\n    return a + b\n\nprint(somme(2, 3))\n`,
  },
  {
    id: "javascript", label: "JavaScript (Node)", monaco: "javascript", filename: "main.js",
    template: `// TP — écrivez votre solution ici\n\nfunction somme(a, b) {\n  return a + b;\n}\n\nconsole.log(somme(2, 3));\n`,
  },
  {
    id: "c", label: "C", monaco: "c", filename: "main.c",
    template: `#include <stdio.h>\n\nint main() {\n    printf("%d\\n", 2 + 3);\n    return 0;\n}\n`,
  },
  {
    id: "cpp", label: "C++", monaco: "cpp", filename: "main.cpp",
    template: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << 2 + 3 << endl;\n    return 0;\n}\n`,
  },
  {
    id: "java", label: "Java", monaco: "java", filename: "Main.java",
    template: `public class Main {\n    public static void main(String[] args) {\n        System.out.println(2 + 3);\n    }\n}\n`,
  },
];

/** Trouve la version Piston la plus récente pour un langage donné. */
export function versionFor(runtimes: Runtime[], language: string): string | null {
  const matches = runtimes.filter((r) => r.language === language || r.aliases.includes(language));
  if (matches.length === 0) return null;
  return matches[0].version;
}
