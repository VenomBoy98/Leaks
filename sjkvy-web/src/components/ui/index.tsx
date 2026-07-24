// Reusable UI primitives distilled from the Stitch design system. These use the exact
// design tokens (primary/secondary colors, rounded-DEFAULT, font-display/body) so anything
// built with them matches the Stitch look. They are provided for the upcoming portal/
// dashboard batches; the consolidated public pages render Stitch markup verbatim and do
// not depend on these (to guarantee zero visual drift in Batch 1).
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

// Button — mirrors the Stitch "Portal Login" / "Explore Programs" and outlined variants.
export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" }) {
  const base = "px-6 py-2 font-body-md text-body-md rounded-DEFAULT transition-all duration-200";
  const styles =
    variant === "primary"
      ? "bg-primary text-on-primary hover:bg-primary/90"
      : "border border-outline-variant text-on-surface hover:border-secondary";
  return <button className={cx(base, styles, className)} {...props} />;
}

// Card — the recurring "museum" surface with soft shadow and hover lift.
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("bg-surface-container-lowest rounded-xl museum-shadow p-8", className)}>
      {children}
    </div>
  );
}

// Container — the max-width content column with responsive gutters.
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop", className)}>
      {children}
    </div>
  );
}

// Section — vertical rhythm wrapper matching the Stitch section spacing.
export function Section({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx("py-20", className)}>{children}</section>;
}

// Input — matches the Stitch login field styling (forms plugin + surface tokens).
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "w-full bg-surface-container-low border border-outline-variant rounded-DEFAULT px-4 py-3",
        "text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-0",
        className,
      )}
      {...props}
    />
  );
}

// Icon — Material Symbols Outlined glyph (same font Stitch used).
export function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={cx("material-symbols-outlined", className)}>{name}</span>;
}
