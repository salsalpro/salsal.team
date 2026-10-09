import Link from "next/link";
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
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path
            d="M24 8H14c-5 0-7 2-7 5s3 4 7 4h4c3 0 5 1 5 4s-3 4-7 4H7M8 24h10c5 0 7-2 7-5s-3-4-7-4h-4c-3 0-5-1-5-4s3-4 7-4h9"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </Link>
  );
}
