/**
 * The kits a logistic request asked for, read from its details snapshot.
 *
 * Requests raised before one could carry more than a single kit hold a `kit`
 * object rather than a `kits` list. The backfill migration rewrote those, so
 * reading both shapes is only a floor under anything it missed.
 */
export const requestedKits = (details) => details?.kits ?? (details?.kit ? [details.kit] : []);

/** How the kit reads wherever it is shown as a chip. */
export const kitLabel = (kit) => `${kit.amount} × ${kit.name}`;
