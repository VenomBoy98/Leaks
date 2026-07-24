// AdmissionPage — renders the admission Stitch page inside the shared Layout.
import StitchContent from "@/lib/StitchContent";
import { html, css } from "./generated/admission";

export default function AdmissionPage() {
  return <StitchContent html={html} css={css} />;
}
