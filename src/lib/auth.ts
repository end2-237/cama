export type Role = "etudiant" | "enseignant" | "admin";

export interface User {
  id:       string;
  name:     string;
  firstName:string;
  lastName: string;
  email:    string;
  role:     Role;
  roleLabel:string;
  school:   string;
  level:    string;
  initials: string;
  avatarColor: string;
}

const USERS: (User & { password: string })[] = [
  {
    id:          "u1",
    name:        "Jean-Paul Mbarga",
    firstName:   "Jean-Paul",
    lastName:    "Mbarga",
    email:       "jean-paul@jfn.cm",
    password:    "etudiant123",
    role:        "etudiant",
    roleLabel:   "Étudiant",
    school:      "École d'Informatique",
    level:       "L2",
    initials:    "JP",
    avatarColor: "bg-cama",
  },
  {
    id:          "u2",
    name:        "Prof. Amina Bello",
    firstName:   "Amina",
    lastName:    "Bello",
    email:       "amina.bello@jfn.cm",
    password:    "enseignant123",
    role:        "enseignant",
    roleLabel:   "Enseignante",
    school:      "École des Sciences",
    level:       "",
    initials:    "AB",
    avatarColor: "bg-gold",
  },
  {
    id:          "u3",
    name:        "Serge Nkamgang",
    firstName:   "Serge",
    lastName:    "Nkamgang",
    email:       "serge.nkamgang@jfn.cm",
    password:    "admin123",
    role:        "admin",
    roleLabel:   "Administrateur",
    school:      "Institut JFN",
    level:       "",
    initials:    "SN",
    avatarColor: "bg-cama-900",
  },
];

export function login(email: string, password: string): User | null {
  const found = USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!found) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...user } = found;
  return user;
}

export function saveSession(user: User) {
  localStorage.setItem("cama_user", JSON.stringify(user));
}

export function loadSession(): User | null {
  try {
    const raw = localStorage.getItem("cama_user");
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("cama_user");
}
