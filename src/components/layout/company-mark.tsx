"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/constants/brand";

type CompanyMarkProps = {
  compact?: boolean;
};

/**
 * Company identity. Uses official logo when present at BRAND.logoPath;
 * otherwise falls back to text initials (do not generate a substitute logo).
 */
export function CompanyMark({ compact = false }: CompanyMarkProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <Link href="/" className="flex items-center gap-3 min-w-0">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--ew-black)] text-[var(--ew-white)]">
        {!logoFailed ? (
          <Image
            src={BRAND.logoPath}
            alt={`${BRAND.name} logo`}
            width={40}
            height={40}
            className="h-full w-full object-cover"
            unoptimized
            onError={() => setLogoFailed(true)}
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
