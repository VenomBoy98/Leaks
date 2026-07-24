// CampusPage — renders the campus Stitch page inside the shared Layout.
import StitchContent from "@/lib/StitchContent";
import { html, css } from "./generated/campus";

export default function CampusPage() {
  return <StitchContent html={html} css={css} />;
}
