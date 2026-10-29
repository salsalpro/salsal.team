import Link from "next/link";
import { BrandLogo } from "./brand-logo";
export function Brand({
  href = "/",
  light = false,
}: {
  href?: string;
  light?: boolean;
}) {
  return (
    <Link
      className={`brand ${light ? "brand-light" : ""}`}
      href={href}
      aria-label="Salsal"
    >
      <BrandLogo className="brand-wordmark" />
    </Link>
  );
}
