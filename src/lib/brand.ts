/**
 * Book identity shown in the header, the login screen and page titles.
 * Override per-deployment with NEXT_PUBLIC_BRAND_* environment variables.
 */
export const BRAND = {
  /** Rendered as three parts so the header can colour each differently. */
  prefix: process.env.NEXT_PUBLIC_BRAND_PREFIX || "RS",
  first: process.env.NEXT_PUBLIC_BRAND_FIRST || "TOSS",
  second: process.env.NEXT_PUBLIC_BRAND_SECOND || "BOOK",
  estd: process.env.NEXT_PUBLIC_BRAND_ESTD || "ESTD 2019",
} as const;

export const BRAND_NAME = `${BRAND.prefix} ${BRAND.first} ${BRAND.second}`;
/** Title case, for sentences: "RS Toss Book — Management". */
export const BRAND_TITLE = `${BRAND.prefix} ${BRAND.first.charAt(0)}${BRAND.first
  .slice(1)
  .toLowerCase()} ${BRAND.second.charAt(0)}${BRAND.second.slice(1).toLowerCase()}`;
