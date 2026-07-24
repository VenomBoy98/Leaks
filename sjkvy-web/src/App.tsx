// App — the single routing system. Each route renders its Stitch page VERBATIM (the page
// includes its own exact header/nav/sidebar/footer as exported — no imposed shell, no
// relabeling, nothing stripped). Pages are lazy-loaded for per-route code splitting.
// FAQ and Certificate Verification share one Stitch export (exported together); both
// routes render it so each URL is preserved.
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

const HomePage = lazy(() => import("@/pages/HomePage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ProgramsPage = lazy(() => import("@/pages/ProgramsPage"));
const CampusPage = lazy(() => import("@/pages/CampusPage"));
const AdmissionPage = lazy(() => import("@/pages/AdmissionPage"));
const FaqCertificatePage = lazy(() => import("@/pages/FaqCertificatePage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/campus" element={<CampusPage />} />
        <Route path="/admission" element={<AdmissionPage />} />
        <Route path="/faq" element={<FaqCertificatePage />} />
        <Route path="/certificate-verification" element={<FaqCertificatePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Suspense>
  );
}
