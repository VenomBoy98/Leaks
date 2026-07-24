// ProgramsPage — renders the programs Stitch page inside the shared Layout.
import StitchContent from "@/lib/StitchContent";
import { html, css } from "./generated/programs";

export default function ProgramsPage() {
  return <StitchContent html={html} css={css} />;
}
