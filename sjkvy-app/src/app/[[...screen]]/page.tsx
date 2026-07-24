import { notFound } from "next/navigation";
import { SCREENS, SCREEN_NAMES } from "@/screens/registry";
import HandoffScreen from "@/components/HandoffScreen";

export function generateStaticParams() {
  return SCREEN_NAMES.map((n) => (n === "index" ? { screen: [] } : { screen: [n] }));
}

export default function Page({ params }: { params: { screen?: string[] } }) {
  const name = params.screen?.[0] ?? "index";
  const screen = SCREENS[name];
  if (!screen) notFound();
  return <HandoffScreen html={screen.html} css={screen.css} name={name} portal={screen.portal} />;
}
