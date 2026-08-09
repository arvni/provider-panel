/**
 * Helpers for the logistics payload a collect request carries in `details`.
 *
 * The webhook spreads its `logistic_information` at the top level of `details`,
 * so both the provider-facing and the admin detail pages read the same keys:
 * `started_at`, `ended_at`, `starting_location`, `ending_location`,
 * `temperature_logs`, `barcode`/`barcodes` and `sample_collector`.
 */

/**
 * Coerce a value that may arrive as a string or a number into a finite number.
 * The webhook types coordinates and temperatures inconsistently.
 */
export const toNumber = (value) => {
    const parsed = typeof value === "number" ? value : parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Turn a location payload into a [lat, lng] pair, or null when unusable.
 */
export const toLatLng = (location) => {
    if (!location) return null;
    const lat = toNumber(location.latitude);
    const lng = toNumber(location.longitude);
    return lat === null || lng === null ? null : [lat, lng];
};

/**
 * Great-circle distance between two [lat, lng] pairs, in metres.
 */
export const haversineMeters = ([lat1, lng1], [lat2, lng2]) => {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
};

export const formatDistance = (meters) =>
    meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;

export const formatAccuracy = (accuracy) => {
    const value = toNumber(accuracy);
    return value === null ? null : `±${value.toFixed(1)} m`;
};

/**
 * Human duration between two timestamps, e.g. "1h 12m" or "27m 46s".
 */
export const formatDuration = (from, to) => {
    if (!from || !to) return null;
    const ms = new Date(to).getTime() - new Date(from).getTime();
    if (!Number.isFinite(ms) || ms < 0) return null;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
};

export const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

export const formatDateTime = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const formatTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

/**
 * Chart series plus the statistics shown above it. The Y domain is derived from
 * the readings themselves so a narrow temperature band stays readable.
 *
 * @param {Array} rawLogs entries shaped `{ value, timestamp }`
 * @param {boolean} isSmall thin the x-axis labels harder on narrow viewports
 */
export const buildTemperatureModel = (rawLogs, isSmall = false) => {
    const logs = (rawLogs || [])
        .map((log) => ({ value: toNumber(log.value), timestamp: log.timestamp }))
        .filter((log) => log.value !== null)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (!logs.length) return null;

    const days = new Set(logs.map((log) => new Date(log.timestamp).toDateString()));
    const singleDay = days.size <= 1;

    const series = logs.map((log) => {
        const date = new Date(log.timestamp);
        return {
            label: singleDay
                ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                : date.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                  }),
            temperature: log.value,
            timestamp: log.timestamp,
        };
    });

    const values = series.map((point) => point.temperature);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    // Pad a nearly flat run so the curve never hugs the top or bottom edge.
    const pad = Math.max(max - min, 0.2) * 0.3;

    const first = values[0];
    const last = values[values.length - 1];

    return {
        series,
        min,
        max,
        average,
        first,
        last,
        drift: last - first,
        minIndex: values.indexOf(min),
        maxIndex: values.indexOf(max),
        from: logs[0].timestamp,
        to: logs[logs.length - 1].timestamp,
        monitoredFor: formatDuration(logs[0].timestamp, logs[logs.length - 1].timestamp),
        domain: [Number((min - pad).toFixed(2)), Number((max + pad).toFixed(2))],
        tickInterval: Math.max(0, Math.ceil(series.length / (isSmall ? 4 : 9)) - 1),
    };
};

/**
 * Everything the tracking panel needs, derived from a collect request's
 * `details` payload.
 */
export const buildLogisticsModel = (details = {}, isSmall = false) => {
    // The payload carries both a singular `barcode` and a `barcodes` list; the
    // singular one is often the only value present, so merge and de-duplicate.
    const barcodes = [
        ...new Set([...(details.barcodes || []), details.barcode].filter(Boolean).map(String)),
    ];

    const startPoint = toLatLng(details.starting_location);
    const endPoint = toLatLng(details.ending_location);
    const mapPoints = [startPoint, endPoint].filter(Boolean);
    const distance = startPoint && endPoint ? haversineMeters(startPoint, endPoint) : null;
    const temperature = buildTemperatureModel(details.temperature_logs, isSmall);

    let mapsHref = null;
    if (startPoint && endPoint) {
        mapsHref = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${startPoint[0]}%2C${startPoint[1]}%3B${endPoint[0]}%2C${endPoint[1]}`;
    } else if (mapPoints.length === 1) {
        const [lat, lng] = mapPoints[0];
        mapsHref = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
    }

    return {
        collector: details.sample_collector,
        barcodes,
        startPoint,
        endPoint,
        mapPoints,
        distance,
        duration: formatDuration(details.started_at, details.ended_at),
        temperature,
        mapsHref,
        hasTracking: Boolean(
            barcodes.length || mapPoints.length || temperature || details.started_at
        ),
    };
};
