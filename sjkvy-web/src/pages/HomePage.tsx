// HomePage — renders the home Stitch page inside the shared Layout.
import StitchContent from "@/lib/StitchContent";
import { html, css } from "./generated/home";

export default function HomePage() {
  return <StitchContent html={html} css={css} />;
}
