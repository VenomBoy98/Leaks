// LoginPage — the applicant login. Standalone (Stitch shipped it without the site nav),
// so it renders outside the shared Layout. No auth logic in this phase (frontend-only).
import StitchContent from "@/lib/StitchContent";
import { html, css } from "./generated/login";

export default function LoginPage() {
  return <StitchContent html={html} css={css} />;
}
