// ContactPage — renders the contact Stitch page inside the shared Layout.
import StitchContent from "@/lib/StitchContent";
import { html, css } from "./generated/contact";

export default function ContactPage() {
  return <StitchContent html={html} css={css} />;
}
