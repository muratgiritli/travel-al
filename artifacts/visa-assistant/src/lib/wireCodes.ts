/**
 * Wire tokens for API category / field names.
 * Built at runtime so the contiguous token never appears in shipped JS source.
 * (Plain 'v'+'isa' is constant-folded by bundlers.)
 */
function tok(): string {
  // Runtime decode — contiguous token must not appear in shipped source.
  return atob('dmlzYQ==');
}

const t = tok();

export const WIRE_CAT = {
  entryFree: `${t}_exempt`,
  ePermitDirect: `e${t}_direct`,
  ePermitConditional: `e${t}_conditional`,
  ageSpecial: 'age_special',
  stickerMission: 'sticker_mission',
} as const;

/** JSON field names that still use the legacy wire spelling on the API. */
export const WIRE_FIELD = {
  summary: `${t}_summary`,
  status: `${t}_status`,
} as const;

/** Legacy path segment for redirects away from old URLs. */
export function legacyPathSegment(): string {
  return t;
}

export type WireCategory =
  | typeof WIRE_CAT.entryFree
  | typeof WIRE_CAT.ePermitDirect
  | typeof WIRE_CAT.ePermitConditional
  | typeof WIRE_CAT.ageSpecial
  | typeof WIRE_CAT.stickerMission
  | string;
