// AboutPage — renders the about Stitch page inside the shared Layout.
import StitchContent from "@/lib/StitchContent";
import { html, css } from "./generated/about";

export default function AboutPage() {
  return <StitchContent html={html} css={css} />;
}
