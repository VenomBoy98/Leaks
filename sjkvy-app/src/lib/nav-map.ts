// nav-map.ts — replaces the prototype support.js shim with real, portal-scoped routing.
// Handoff nav links are href="#"; their text is "<icon_name> <Label>" (a Material Symbols
// ligature span sits inside the <a>). We strip the leading icon token and resolve the label
// to a route within the current portal, so every screen interconnects.

export const SCREEN_ROUTE = (name: string): string => (name === "index" ? "/" : `/${name}`);

// Strip a leading material-symbol icon token (lowercase_with_underscores) from link text.
export function labelOf(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  // remove a leading icon ligature token if a human label follows it
  const m = t.match(/^([a-z][a-z_]{2,})\s+(.*)$/);
  return (m ? m[2] : t).toLowerCase();
}

type Map = Record<string, string>;

const PUBLIC: Map = {
  home: "/home", admissions: "/", schemes: "/schemes", programs: "/schemes",
  centres: "/campus", centers: "/campus", campus: "/campus", about: "/about",
  support: "/support", faq: "/support", "verify certificate": "/support",
  contact: "/contact", login: "/login", "portal login": "/login", "sign in": "/login",
  register: "/register", "get started": "/register", "all screens": "/sitemap",
  dashboard: "/dashboard",
};
const APPLICANT: Map = {
  dashboard: "/dashboard", application: "/application", "my application": "/application",
  documents: "/documents", timeline: "/timeline", notifications: "/notifications",
  profile: "/profile", settings: "/profile", support: "/support",
};
const STUDENT: Map = {
  dashboard: "/student-dashboard", attendance: "/attendance", hostel: "/hostel",
  assessments: "/assessments", certificates: "/certificates", placement: "/placement",
  profile: "/student-profile", "my profile": "/student-profile", support: "/support",
};
const STAFF: Map = {
  dashboard: "/staff-dashboard", verification: "/verification", counselling: "/counselling",
  attendance: "/staff-attendance", hostel: "/staff-hostel", placement: "/staff-placement",
  reports: "/staff-reports", directory: "/staff-directory", support: "/support",
};
const ADMIN: Map = {
  dashboard: "/admin-dashboard", applications: "/admin-applications",
  admissions: "/admin-admissions", "batch management": "/admin-programs",
  programs: "/admin-programs", directory: "/admin-directory",
  "hostel tracking": "/admin-hostel", hostel: "/admin-hostel",
  assessments: "/admin-assessments", certificates: "/admin-certificates",
  reports: "/admin-reports", "industry relations": "/admin-industry", industry: "/admin-industry",
  settings: "/admin-settings", support: "/support",
};

const BY_PORTAL: Record<string, Map> = {
  public: PUBLIC, applicant: APPLICANT, student: STUDENT, staff: STAFF, admin: ADMIN,
};

// Resolve a clicked nav label within a portal (falls back to public), returning a route or null.
export function resolveNav(portal: string, rawText: string): string | null {
  const label = labelOf(rawText);
  return BY_PORTAL[portal]?.[label] ?? PUBLIC[label] ?? null;
}

// Logout link labels.
export const LOGOUT_RE = /^(sign out|log ?out|logout)$/i;

// Role → home route after login.
export const ROLE_HOME: Record<string, string> = {
  applicant: "/dashboard", student: "/student-dashboard",
  staff: "/staff-dashboard", admin: "/admin-dashboard", public: "/",
};
