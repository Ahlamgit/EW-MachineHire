"use client";

import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/constants/brand";

type CompanyMarkProps = {
  compact?: boolean;
  /** When false, skip requesting the logo file (avoids 404 until official asset is placed). */
  hasLogo?: boolean;
};

/**
 * Company identity. Renders the official logo only when `hasLogo` is true
 * (file at public/brand/ew-machine-hire-logo.jpg). Never generate a substitute logo.
 */
export function CompanyMark({ compact = false, hasLogo = false }: CompanyMarkProps) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-3">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--ew-black)] text-[var(--ew-white)]">
        {hasLogo ? (
          <Image
            src={BRAND.logoPath}
            alt={`${BRAND.name} logo`}
            width={40}
            height={40}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-[10px] font-bold tracking-wide" aria-hidden>
            EW
          </span>
        )}
      </div>
      {!compact ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight text-[var(--ew-black)]">
            {BRAND.name}
          </p>
          <p className="truncate text-xs text-[var(--ew-muted)]">
            Heavy equipment hire
          </p>
        </div>
      ) : null}
    </Link>
  );
}
