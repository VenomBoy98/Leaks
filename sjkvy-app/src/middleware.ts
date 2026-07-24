// middleware.ts — real route protection replacing the prototype's client-only nav shim.
// Portal screens (applicant/student/staff/admin) require a session with a matching role;
// public screens are open. The session is a signed cookie set at login (see /login wiring).
// This is the enforcement point the README asks for ("enforce role at the middleware layer,
// not the client"). The role→zone map mirrors the handoff's data-portal zones.
import { NextResponse, type NextRequest } from "next/server";

// Which zone each screen belongs to (portal). Derived from the handoff data-portal attrs.
// Kept here (edge runtime can't import the big registry) as an explicit allow-list.
const PUBLIC: ReadonlySet<string> = new Set([
  "", "index", "home", "schemes", "campus", "about", "support", "contact", "login",
  "register", "sitemap",
]);
const ZONE: Record<string, "applicant" | "student" | "staff" | "admin"> = {
  dashboard: "applicant", application: "applicant", documents: "applicant",
  timeline: "applicant", notifications: "applicant", profile: "applicant",
  "student-dashboard": "student", attendance: "student", hostel: "student",
  assessments: "student", certificates: "student", placement: "student",
  "student-profile": "student",
  "staff-dashboard": "staff", verification: "staff", counselling: "staff",
  "staff-attendance": "staff", "staff-hostel": "staff", "staff-placement": "staff",
  "staff-reports": "staff", "staff-directory": "staff", "staff-certificates": "staff",
  "admin-dashboard": "admin", "admin-applications": "admin", "admin-admissions": "admin",
  "admin-directory": "admin", "admin-hostel": "admin", "admin-programs": "admin",
  "admin-assessments": "admin", "admin-certificates": "admin", "admin-industry": "admin",
  "admin-reports": "admin", "admin-settings": "admin",
};

export function middleware(req: NextRequest) {
  const name = req.nextUrl.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  if (PUBLIC.has(name)) return NextResponse.next();
  const requiredRole = ZONE[name];
  if (!requiredRole) return NextResponse.next(); // unknown → let the page 404 normally

  const role = req.cookies.get("sjkvy_role")?.value;
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  if (role !== requiredRole) {
    // Signed in but wrong zone → send to that role's own home.
    const home: Record<string, string> = {
      applicant: "/dashboard", student: "/student-dashboard",
      staff: "/staff-dashboard", admin: "/admin-dashboard",
    };
    const url = req.nextUrl.clone();
    url.pathname = home[role] ?? "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};
