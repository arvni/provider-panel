import React, { useEffect, useMemo, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    Paper,
    Stack,
    Typography,
    Avatar,
    Card,
    CardContent,
    useTheme,
    useMediaQuery,
    alpha,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from "@mui/material";
import {
    Person,
    Phone,
    Schedule,
    Notes,
    Receipt,
    LocalShipping,
    Event,
    LocationOn,
    ArrowBack,
    Biotech,
    Vaccines,
    QrCode,
    Timeline,
    ExpandMore,
    Info,
    AcUnit,
    Whatshot,
    TrendingUp,
    TrendingDown,
    Straighten,
    HourglassBottom,
    FlagCircle,
    PlayCircle,
    MyLocation,
} from "@mui/icons-material";
import { router } from "@inertiajs/react";
import PageHeader from "@/Components/PageHeader";
import {
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    ComposedChart,
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icons for Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons
const startIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const endIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

/**
 * Coerce a value that may arrive as a string or a number into a finite number.
 * The webhook sends coordinates and temperatures inconsistently typed.
 */
const toNumber = (value) => {
    const parsed = typeof value === "number" ? value : parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Turn a location payload into a [lat, lng] pair, or null when unusable.
 */
const toLatLng = (location) => {
    if (!location) return null;
    const lat = toNumber(location.latitude);
    const lng = toNumber(location.longitude);
    return lat === null || lng === null ? null : [lat, lng];
};

/**
 * Great-circle distance between two [lat, lng] pairs, in metres.
 */
const haversineMeters = ([lat1, lng1], [lat2, lng2]) => {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
};

const formatDistance = (meters) =>
    meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;

const formatAccuracy = (accuracy) => {
    const value = toNumber(accuracy);
    return value === null ? null : `±${value.toFixed(1)} m`;
};

/**
 * Human duration between two timestamps, e.g. "1h 12m" or "27m 46s".
 */
const formatDuration = (from, to) => {
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

const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

const formatDateTime = (dateString) => {
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

const formatTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case "requested":
        case "pending":
        case "waiting_for_assign":
            return "warning";
        case "scheduled":
        case "sample_collector_on_the_way":
            return "info";
        case "picked_up":
        case "picked up":
            return "primary";
        case "received":
            return "success";
        case "cancelled":
            return "error";
        default:
            return "default";
    }
};

const getStatusLabel = (status) => {
    const labelMap = {
        requested: "Requested",
        pending: "Pending",
        waiting_for_assign: "Waiting for Assignment",
        scheduled: "Scheduled",
        sample_collector_on_the_way: "Collector On The Way",
        picked_up: "Picked Up",
        received: "Received",
        cancelled: "Cancelled",
    };
    return labelMap[status?.toLowerCase()] || status;
};

/**
 * Compact labelled metric used across the summary and temperature panels.
 */
const StatTile = ({ icon, label, value, caption, color = "text.primary" }) => (
    <Stack spacing={0.5}>
        <Stack direction="row" spacing={0.75} alignItems="center">
            {icon}
            <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                letterSpacing={0.6}
            >
                {label}
            </Typography>
        </Stack>
        <Typography variant="h6" fontWeight={700} color={color} lineHeight={1.3}>
            {value}
        </Typography>
        {caption && (
            <Typography variant="caption" color="text.secondary">
                {caption}
            </Typography>
        )}
    </Stack>
);

/**
 * Keeps the map framed around every point we have instead of a fixed zoom.
 */
const FitBounds = ({ points }) => {
    const map = useMap();

    useEffect(() => {
        if (!points.length) return;
        if (points.length === 1) {
            map.setView(points[0], 16);
            return;
        }
        map.fitBounds(L.latLngBounds(points), { padding: [56, 56], maxZoom: 17 });
    }, [map, points]);

    return null;
};

/**
 * Popup body shared by the start and end markers.
 */
const LocationPopup = ({ title, color, location }) => (
    <Box sx={{ minWidth: 190 }}>
        <Typography variant="subtitle2" fontWeight={700} color={color}>
            {title}
        </Typography>
        {location.timestamp && (
            <Typography variant="body2" sx={{ mb: 0.5 }}>
                {formatDateTime(location.timestamp)}
            </Typography>
        )}
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
            {toNumber(location.latitude)?.toFixed(6)}, {toNumber(location.longitude)?.toFixed(6)}
        </Typography>
        {formatAccuracy(location.accuracy) && (
            <Typography variant="caption" color="text.secondary">
                Accuracy {formatAccuracy(location.accuracy)}
            </Typography>
        )}
    </Box>
);

/**
 * User CollectRequest Show component
 * Displays detailed information about a collection request (read-only for users)
 */
const UserShow = ({ collectRequest }) => {
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
    const [expanded, setExpanded] = useState(["details", "tracking", "orders"]);

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded((prev) => (isExpanded ? [...prev, panel] : prev.filter((p) => p !== panel)));
    };

    const handleBack = () => {
        router.get(route("collectRequests.index"));
    };

    const details = collectRequest.details || {};
    const collector = details.sample_collector;

    // The payload carries both a singular `barcode` and a `barcodes` list; the
    // singular one is often the only value present, so merge and de-duplicate.
    const barcodes = useMemo(() => {
        const list = [...(details.barcodes || []), details.barcode];
        return [...new Set(list.filter(Boolean).map(String))];
    }, [details.barcodes, details.barcode]);

    const startPoint = useMemo(
        () => toLatLng(details.starting_location),
        [details.starting_location]
    );
    const endPoint = useMemo(() => toLatLng(details.ending_location), [details.ending_location]);
    const mapPoints = useMemo(() => [startPoint, endPoint].filter(Boolean), [startPoint, endPoint]);

    const distance = startPoint && endPoint ? haversineMeters(startPoint, endPoint) : null;
    const duration = formatDuration(details.started_at, details.ended_at);

    /**
     * Chart series plus the statistics shown above it. The Y domain is derived
     * from the readings themselves so a narrow temperature band stays readable.
     */
    const temperature = useMemo(() => {
        const logs = (details.temperature_logs || [])
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
    }, [details.temperature_logs, isSmall]);

    const hasTracking = Boolean(
        barcodes.length || startPoint || endPoint || temperature || details.started_at
    );

    const mapsHref = useMemo(() => {
        if (startPoint && endPoint) {
            return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${startPoint[0]}%2C${startPoint[1]}%3B${endPoint[0]}%2C${endPoint[1]}`;
        }
        const single = startPoint || endPoint;
        if (!single) return null;
        return `https://www.openstreetmap.org/?mlat=${single[0]}&mlon=${single[1]}#map=16/${single[0]}/${single[1]}`;
    }, [startPoint, endPoint]);

    return (
        <AuthenticatedLayout>
            <PageHeader
                title={
                    <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        useFlexGap
                        flexWrap="wrap"
                    >
                        <Typography variant="h5" component="span">
                            Collection Request #{collectRequest.id}
                        </Typography>
                        <Chip
                            label={getStatusLabel(collectRequest.status)}
                            color={getStatusColor(collectRequest.status)}
                            size="medium"
                            sx={{ fontWeight: 600, textTransform: "capitalize" }}
                        />
                        {barcodes.length === 1 && (
                            <Chip
                                icon={<QrCode />}
                                label={barcodes[0]}
                                variant="outlined"
                                size="medium"
                                sx={{ fontFamily: "monospace", fontWeight: 600 }}
                            />
                        )}
                        {collector?.name && (
                            <Chip
                                avatar={
                                    <Avatar sx={{ textTransform: "uppercase" }}>
                                        {collector.name.charAt(0)}
                                    </Avatar>
                                }
                                label={collector.name}
                                variant="outlined"
                                size="medium"
                                sx={{ textTransform: "capitalize" }}
                            />
                        )}
                    </Stack>
                }
                action={
                    <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleBack}>
                        Back to List
                    </Button>
                }
            />

            <Box>
                {/* Accordion 1: Collection Details */}
                <Accordion
                    expanded={expanded.includes("details")}
                    onChange={handleAccordionChange("details")}
                    sx={{ mb: 2, boxShadow: theme.shadows[2] }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMore />}
                        sx={{
                            bgcolor: "primary.lighter",
                            "&:hover": { bgcolor: "primary.light" },
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Info color="primary" />
                            <Typography variant="h6" fontWeight={600}>
                                Collection Details
                            </Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                        <Box sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                {/* Key Information Summary Card */}
                                <Grid size={12}>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            bgcolor: "primary.lighter",
                                            borderColor: "primary.main",
                                            borderWidth: 2,
                                        }}
                                    >
                                        <CardContent>
                                            <Grid container spacing={3}>
                                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                    <StatTile
                                                        icon={
                                                            <Event
                                                                color="primary"
                                                                fontSize="small"
                                                            />
                                                        }
                                                        label="PREFERRED DATE"
                                                        value={formatDate(
                                                            collectRequest.preferred_date
                                                        )}
                                                    />
                                                </Grid>

                                                {(details.collection_date ||
                                                    details.collection_time) && (
                                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                        <StatTile
                                                            icon={
                                                                <Schedule
                                                                    color="primary"
                                                                    fontSize="small"
                                                                />
                                                            }
                                                            label="SCHEDULED"
                                                            value={`${
                                                                details.collection_date
                                                                    ? formatDate(
                                                                          details.collection_date
                                                                      )
                                                                    : ""
                                                            }${
                                                                details.collection_time
                                                                    ? ` at ${details.collection_time}`
                                                                    : ""
                                                            }`}
                                                        />
                                                    </Grid>
                                                )}

                                                {details.started_at && (
                                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                        <StatTile
                                                            icon={
                                                                <LocalShipping
                                                                    color="success"
                                                                    fontSize="small"
                                                                />
                                                            }
                                                            label="ACTUAL PICKUP"
                                                            value={formatDateTime(
                                                                details.started_at
                                                            )}
                                                            caption={
                                                                duration
                                                                    ? `Completed in ${duration}`
                                                                    : undefined
                                                            }
                                                            color="success.main"
                                                        />
                                                    </Grid>
                                                )}

                                                {collector?.name && (
                                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                        <StatTile
                                                            icon={
                                                                <Person
                                                                    color="primary"
                                                                    fontSize="small"
                                                                />
                                                            }
                                                            label="SAMPLE COLLECTOR"
                                                            value={
                                                                <Box
                                                                    component="span"
                                                                    sx={{
                                                                        textTransform: "capitalize",
                                                                    }}
                                                                >
                                                                    {collector.name}
                                                                </Box>
                                                            }
                                                        />
                                                    </Grid>
                                                )}

                                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                    <StatTile
                                                        icon={
                                                            <Receipt
                                                                color="primary"
                                                                fontSize="small"
                                                            />
                                                        }
                                                        label="TOTAL ORDERS"
                                                        value={`${collectRequest.orders?.length || 0} Order${
                                                            collectRequest.orders?.length !== 1
                                                                ? "s"
                                                                : ""
                                                        }`}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Contact Information Section */}
                                {(details.address || details.phone) && (
                                    <Grid size={12}>
                                        <Typography
                                            variant="h6"
                                            gutterBottom
                                            sx={{ fontWeight: 600, mt: 2 }}
                                        >
                                            Contact Information
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {details.address && (
                                                <Grid size={{ xs: 12, md: details.phone ? 8 : 12 }}>
                                                    <Paper variant="outlined" sx={{ p: 2.5 }}>
                                                        <Stack
                                                            direction="row"
                                                            spacing={2}
                                                            alignItems="flex-start"
                                                        >
                                                            <Avatar
                                                                sx={{ bgcolor: "secondary.main" }}
                                                            >
                                                                <LocationOn />
                                                            </Avatar>
                                                            <Box>
                                                                <Typography
                                                                    variant="subtitle2"
                                                                    color="text.secondary"
                                                                    gutterBottom
                                                                >
                                                                    Collection Address
                                                                </Typography>
                                                                <Typography variant="body1">
                                                                    {details.address}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </Paper>
                                                </Grid>
                                            )}

                                            {details.phone && (
                                                <Grid
                                                    size={{ xs: 12, md: details.address ? 4 : 12 }}
                                                >
                                                    <Paper variant="outlined" sx={{ p: 2.5 }}>
                                                        <Stack
                                                            direction="row"
                                                            spacing={2}
                                                            alignItems="flex-start"
                                                        >
                                                            <Avatar
                                                                sx={{ bgcolor: "success.main" }}
                                                            >
                                                                <Phone />
                                                            </Avatar>
                                                            <Box>
                                                                <Typography
                                                                    variant="subtitle2"
                                                                    color="text.secondary"
                                                                    gutterBottom
                                                                >
                                                                    Contact Phone
                                                                </Typography>
                                                                <Typography
                                                                    variant="body1"
                                                                    fontWeight={500}
                                                                >
                                                                    {details.phone}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </Paper>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Grid>
                                )}

                                {/* Notes Section */}
                                {collectRequest.notes && (
                                    <Grid size={12}>
                                        <Typography
                                            variant="h6"
                                            gutterBottom
                                            sx={{ fontWeight: 600, mt: 2 }}
                                        >
                                            Additional Notes
                                        </Typography>
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 2.5,
                                                bgcolor: "warning.lighter",
                                                borderColor: "warning.main",
                                            }}
                                        >
                                            <Stack
                                                direction="row"
                                                spacing={2}
                                                alignItems="flex-start"
                                            >
                                                <Avatar sx={{ bgcolor: "warning.main" }}>
                                                    <Notes />
                                                </Avatar>
                                                <Typography variant="body1" sx={{ pt: 0.5 }}>
                                                    {collectRequest.notes}
                                                </Typography>
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* Accordion 2: Tracking Information */}
                <Accordion
                    expanded={expanded.includes("tracking")}
                    onChange={handleAccordionChange("tracking")}
                    sx={{ mb: 2, boxShadow: theme.shadows[2] }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMore />}
                        sx={{
                            bgcolor: "success.lighter",
                            "&:hover": { bgcolor: "success.light" },
                        }}
                    >
                        <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            useFlexGap
                            flexWrap="wrap"
                        >
                            <Timeline color="success" />
                            <Typography variant="h6" fontWeight={600}>
                                Logistics Tracking
                            </Typography>
                            {temperature && (
                                <Chip
                                    size="small"
                                    variant="outlined"
                                    icon={<AcUnit />}
                                    label={`${temperature.min.toFixed(2)}°C – ${temperature.max.toFixed(2)}°C`}
                                    sx={{ fontWeight: 600 }}
                                />
                            )}
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                        <Box sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                {/* Journey timeline: start -> end with duration and distance */}
                                {(details.started_at || details.ended_at) && (
                                    <Grid size={12}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Stack
                                                    direction={{ xs: "column", md: "row" }}
                                                    spacing={2}
                                                    alignItems={{ xs: "stretch", md: "center" }}
                                                    divider={
                                                        <Divider
                                                            orientation={
                                                                isSmall ? "horizontal" : "vertical"
                                                            }
                                                            flexItem
                                                        />
                                                    }
                                                >
                                                    <Stack
                                                        direction="row"
                                                        spacing={1.5}
                                                        alignItems="center"
                                                        sx={{ flex: 1 }}
                                                    >
                                                        <PlayCircle color="success" />
                                                        <Box>
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                fontWeight={700}
                                                            >
                                                                PICKED UP
                                                            </Typography>
                                                            <Typography
                                                                variant="body1"
                                                                fontWeight={600}
                                                            >
                                                                {formatDateTime(details.started_at)}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>

                                                    <Stack
                                                        spacing={0.5}
                                                        alignItems="center"
                                                        sx={{ flex: 1 }}
                                                    >
                                                        <Stack
                                                            direction="row"
                                                            spacing={2}
                                                            alignItems="center"
                                                            useFlexGap
                                                            flexWrap="wrap"
                                                            justifyContent="center"
                                                        >
                                                            {duration && (
                                                                <Chip
                                                                    size="small"
                                                                    icon={<HourglassBottom />}
                                                                    label={duration}
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                            {distance !== null && (
                                                                <Chip
                                                                    size="small"
                                                                    icon={<Straighten />}
                                                                    label={formatDistance(distance)}
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </Stack>
                                                        <Box
                                                            sx={{
                                                                width: "100%",
                                                                height: 2,
                                                                borderRadius: 1,
                                                                background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.error.main})`,
                                                                display: {
                                                                    xs: "none",
                                                                    md: "block",
                                                                },
                                                            }}
                                                        />
                                                    </Stack>

                                                    <Stack
                                                        direction="row"
                                                        spacing={1.5}
                                                        alignItems="center"
                                                        sx={{ flex: 1 }}
                                                        justifyContent={{
                                                            xs: "flex-start",
                                                            md: "flex-end",
                                                        }}
                                                    >
                                                        <FlagCircle color="error" />
                                                        <Box>
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                fontWeight={700}
                                                            >
                                                                DELIVERED
                                                            </Typography>
                                                            <Typography
                                                                variant="body1"
                                                                fontWeight={600}
                                                            >
                                                                {formatDateTime(details.ended_at)}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}

                                {/* Barcodes */}
                                {barcodes.length > 0 && (
                                    <Grid size={12}>
                                        <Typography
                                            variant="h6"
                                            gutterBottom
                                            sx={{ fontWeight: 600 }}
                                        >
                                            Sample Barcodes ({barcodes.length})
                                        </Typography>
                                        <Paper variant="outlined" sx={{ p: 2.5 }}>
                                            <Stack
                                                direction="row"
                                                spacing={2}
                                                alignItems="flex-start"
                                            >
                                                <Avatar sx={{ bgcolor: "primary.main" }}>
                                                    <QrCode />
                                                </Avatar>
                                                <Box
                                                    sx={{
                                                        flex: 1,
                                                        display: "flex",
                                                        flexWrap: "wrap",
                                                        gap: 1,
                                                    }}
                                                >
                                                    {barcodes.map((barcode) => (
                                                        <Chip
                                                            key={barcode}
                                                            label={barcode}
                                                            variant="filled"
                                                            color="primary"
                                                            sx={{
                                                                fontFamily: "monospace",
                                                                fontWeight: 600,
                                                                fontSize: "0.875rem",
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                )}

                                {/* Location Tracking */}
                                {mapPoints.length > 0 && (
                                    <Grid size={12}>
                                        <Typography
                                            variant="h6"
                                            gutterBottom
                                            sx={{ fontWeight: 600, mt: 2 }}
                                        >
                                            Route Map
                                        </Typography>
                                        <Card variant="outlined">
                                            <CardContent sx={{ p: 2 }}>
                                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                                    {details.starting_location && (
                                                        <Grid size={{ xs: 12, sm: 4 }}>
                                                            <StatTile
                                                                icon={
                                                                    <MyLocation
                                                                        color="success"
                                                                        fontSize="small"
                                                                    />
                                                                }
                                                                label="START"
                                                                value={
                                                                    formatTime(
                                                                        details.starting_location
                                                                            .timestamp
                                                                    ) || "—"
                                                                }
                                                                caption={formatAccuracy(
                                                                    details.starting_location
                                                                        .accuracy
                                                                )}
                                                            />
                                                        </Grid>
                                                    )}
                                                    {details.ending_location && (
                                                        <Grid size={{ xs: 12, sm: 4 }}>
                                                            <StatTile
                                                                icon={
                                                                    <LocationOn
                                                                        color="error"
                                                                        fontSize="small"
                                                                    />
                                                                }
                                                                label="END"
                                                                value={
                                                                    formatTime(
                                                                        details.ending_location
                                                                            .timestamp
                                                                    ) || "—"
                                                                }
                                                                caption={formatAccuracy(
                                                                    details.ending_location.accuracy
                                                                )}
                                                            />
                                                        </Grid>
                                                    )}
                                                    {distance !== null && (
                                                        <Grid size={{ xs: 12, sm: 4 }}>
                                                            <StatTile
                                                                icon={
                                                                    <Straighten
                                                                        color="primary"
                                                                        fontSize="small"
                                                                    />
                                                                }
                                                                label="STRAIGHT-LINE"
                                                                value={formatDistance(distance)}
                                                                caption="Between start and end"
                                                            />
                                                        </Grid>
                                                    )}
                                                </Grid>

                                                <Box
                                                    sx={{
                                                        width: "100%",
                                                        height: 420,
                                                        borderRadius: 2,
                                                        overflow: "hidden",
                                                        border: `1px solid ${theme.palette.divider}`,
                                                        "& .leaflet-container": {
                                                            height: "100%",
                                                            width: "100%",
                                                        },
                                                    }}
                                                >
                                                    <MapContainer
                                                        center={mapPoints[0]}
                                                        zoom={15}
                                                        scrollWheelZoom={false}
                                                        style={{ height: "100%", width: "100%" }}
                                                    >
                                                        <TileLayer
                                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                        />
                                                        <FitBounds points={mapPoints} />

                                                        {startPoint && (
                                                            <Marker
                                                                position={startPoint}
                                                                icon={startIcon}
                                                            >
                                                                <Popup>
                                                                    <LocationPopup
                                                                        title="Start Location"
                                                                        color="success.main"
                                                                        location={
                                                                            details.starting_location
                                                                        }
                                                                    />
                                                                </Popup>
                                                            </Marker>
                                                        )}

                                                        {endPoint && (
                                                            <Marker
                                                                position={endPoint}
                                                                icon={endIcon}
                                                            >
                                                                <Popup>
                                                                    <LocationPopup
                                                                        title="End Location"
                                                                        color="error.main"
                                                                        location={
                                                                            details.ending_location
                                                                        }
                                                                    />
                                                                </Popup>
                                                            </Marker>
                                                        )}

                                                        {startPoint && endPoint && (
                                                            <Polyline
                                                                positions={[startPoint, endPoint]}
                                                                color={theme.palette.primary.main}
                                                                weight={3}
                                                                opacity={0.7}
                                                                dashArray="10, 10"
                                                            />
                                                        )}
                                                    </MapContainer>
                                                </Box>

                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<LocationOn />}
                                                    href={mapsHref}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    fullWidth
                                                    sx={{ mt: 2 }}
                                                >
                                                    Open in OpenStreetMap
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}

                                {/* Temperature Logs */}
                                {temperature && (
                                    <Grid size={12}>
                                        <Typography
                                            variant="h6"
                                            gutterBottom
                                            sx={{ fontWeight: 600, mt: 2 }}
                                        >
                                            Temperature Monitoring
                                        </Typography>
                                        <Card variant="outlined">
                                            <CardContent sx={{ p: 2 }}>
                                                <Grid
                                                    container
                                                    spacing={2}
                                                    sx={{
                                                        mb: 2,
                                                        p: 2,
                                                        bgcolor: alpha(
                                                            theme.palette.primary.main,
                                                            0.04
                                                        ),
                                                        borderRadius: 1,
                                                    }}
                                                >
                                                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                                        <StatTile
                                                            icon={
                                                                <Timeline
                                                                    fontSize="small"
                                                                    color="disabled"
                                                                />
                                                            }
                                                            label="READINGS"
                                                            value={temperature.series.length}
                                                            caption={
                                                                temperature.monitoredFor
                                                                    ? `over ${temperature.monitoredFor}`
                                                                    : undefined
                                                            }
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                                        <StatTile
                                                            icon={
                                                                <AcUnit
                                                                    fontSize="small"
                                                                    color="info"
                                                                />
                                                            }
                                                            label="MIN"
                                                            value={`${temperature.min.toFixed(2)}°C`}
                                                            color="info.main"
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                                        <StatTile
                                                            icon={
                                                                <Whatshot
                                                                    fontSize="small"
                                                                    color="error"
                                                                />
                                                            }
                                                            label="MAX"
                                                            value={`${temperature.max.toFixed(2)}°C`}
                                                            color="error.main"
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                                        <StatTile
                                                            label="AVERAGE"
                                                            value={`${temperature.average.toFixed(2)}°C`}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                                        <StatTile
                                                            label="SPREAD"
                                                            value={`${(
                                                                temperature.max - temperature.min
                                                            ).toFixed(2)}°C`}
                                                            caption="max − min"
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                                        <StatTile
                                                            icon={
                                                                temperature.drift >= 0 ? (
                                                                    <TrendingUp
                                                                        fontSize="small"
                                                                        color="error"
                                                                    />
                                                                ) : (
                                                                    <TrendingDown
                                                                        fontSize="small"
                                                                        color="info"
                                                                    />
                                                                )
                                                            }
                                                            label="START → END"
                                                            value={`${
                                                                temperature.drift >= 0 ? "+" : "−"
                                                            }${Math.abs(temperature.drift).toFixed(2)}°C`}
                                                            color={
                                                                temperature.drift >= 0
                                                                    ? "error.main"
                                                                    : "info.main"
                                                            }
                                                            caption={`${temperature.first.toFixed(
                                                                2
                                                            )} → ${temperature.last.toFixed(2)}°C`}
                                                        />
                                                    </Grid>
                                                </Grid>

                                                <Box sx={{ width: "100%", height: 360 }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <ComposedChart
                                                            data={temperature.series}
                                                            margin={{
                                                                top: 10,
                                                                right: 24,
                                                                left: 0,
                                                                bottom: 8,
                                                            }}
                                                        >
                                                            <defs>
                                                                <linearGradient
                                                                    id="tempFill"
                                                                    x1="0"
                                                                    y1="0"
                                                                    x2="0"
                                                                    y2="1"
                                                                >
                                                                    <stop
                                                                        offset="0%"
                                                                        stopColor={
                                                                            theme.palette.primary
                                                                                .main
                                                                        }
                                                                        stopOpacity={0.35}
                                                                    />
                                                                    <stop
                                                                        offset="100%"
                                                                        stopColor={
                                                                            theme.palette.primary
                                                                                .main
                                                                        }
                                                                        stopOpacity={0.02}
                                                                    />
                                                                </linearGradient>
                                                            </defs>

                                                            <CartesianGrid
                                                                strokeDasharray="3 3"
                                                                vertical={false}
                                                                stroke={theme.palette.divider}
                                                            />
                                                            <XAxis
                                                                dataKey="label"
                                                                interval={temperature.tickInterval}
                                                                tickMargin={8}
                                                                tick={{ fontSize: 12 }}
                                                                stroke={
                                                                    theme.palette.text.secondary
                                                                }
                                                            />
                                                            <YAxis
                                                                domain={temperature.domain}
                                                                width={64}
                                                                tickFormatter={(value) =>
                                                                    `${value.toFixed(1)}°`
                                                                }
                                                                tick={{ fontSize: 12 }}
                                                                stroke={
                                                                    theme.palette.text.secondary
                                                                }
                                                            />
                                                            <Tooltip
                                                                cursor={{
                                                                    stroke: theme.palette.divider,
                                                                }}
                                                                content={({ active, payload }) => {
                                                                    if (!active || !payload?.length)
                                                                        return null;
                                                                    const point =
                                                                        payload[0].payload;
                                                                    return (
                                                                        <Paper
                                                                            elevation={3}
                                                                            sx={{ p: 1.5 }}
                                                                        >
                                                                            <Typography
                                                                                variant="caption"
                                                                                color="text.secondary"
                                                                            >
                                                                                {formatDateTime(
                                                                                    point.timestamp
                                                                                )}
                                                                            </Typography>
                                                                            <Typography
                                                                                variant="h6"
                                                                                fontWeight={700}
                                                                                color="primary.main"
                                                                            >
                                                                                {point.temperature.toFixed(
                                                                                    2
                                                                                )}
                                                                                °C
                                                                            </Typography>
                                                                        </Paper>
                                                                    );
                                                                }}
                                                            />

                                                            <ReferenceLine
                                                                y={temperature.average}
                                                                stroke={
                                                                    theme.palette.text.secondary
                                                                }
                                                                strokeDasharray="2 6"
                                                                label={{
                                                                    value: `avg ${temperature.average.toFixed(2)}°C`,
                                                                    position: "insideLeft",
                                                                    fill: theme.palette.text
                                                                        .secondary,
                                                                    fontSize: 11,
                                                                }}
                                                            />

                                                            <Area
                                                                type="monotone"
                                                                dataKey="temperature"
                                                                name="Temperature"
                                                                stroke={theme.palette.primary.main}
                                                                strokeWidth={2}
                                                                fill="url(#tempFill)"
                                                                activeDot={{ r: 5 }}
                                                                // Emphasise the coldest and warmest
                                                                // readings; keep the rest subtle.
                                                                dot={({ cx, cy, index }) => {
                                                                    const isPeak =
                                                                        index ===
                                                                            temperature.minIndex ||
                                                                        index ===
                                                                            temperature.maxIndex;
                                                                    return (
                                                                        <circle
                                                                            key={index}
                                                                            cx={cx}
                                                                            cy={cy}
                                                                            r={isPeak ? 4 : 2}
                                                                            fill={
                                                                                theme.palette
                                                                                    .primary.main
                                                                            }
                                                                            stroke={
                                                                                isPeak
                                                                                    ? theme.palette
                                                                                          .primary
                                                                                          .dark
                                                                                    : undefined
                                                                            }
                                                                            strokeWidth={
                                                                                isPeak ? 2 : 0
                                                                            }
                                                                        />
                                                                    );
                                                                }}
                                                            />
                                                        </ComposedChart>
                                                    </ResponsiveContainer>
                                                </Box>

                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    sx={{ mt: 1.5 }}
                                                >
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {temperature.series.length} readings from{" "}
                                                        {formatDateTime(temperature.from)} to{" "}
                                                        {formatDateTime(temperature.to)}
                                                    </Typography>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}

                                {/* No tracking data message */}
                                {!hasTracking && (
                                    <Grid size={12}>
                                        <Paper
                                            variant="outlined"
                                            sx={{ p: 3, textAlign: "center" }}
                                        >
                                            <Typography color="text.secondary">
                                                No tracking information available yet
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    </AccordionDetails>
                </Accordion>

                {/* Accordion 3: Orders */}
                <Accordion
                    expanded={expanded.includes("orders")}
                    onChange={handleAccordionChange("orders")}
                    sx={{ mb: 2, boxShadow: theme.shadows[2] }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMore />}
                        sx={{
                            bgcolor: "warning.lighter",
                            "&:hover": { bgcolor: "warning.light" },
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Receipt color="warning" />
                            <Typography variant="h6" fontWeight={600}>
                                Orders ({collectRequest.orders?.length || 0})
                            </Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                        <Box sx={{ p: 3 }}>
                            {collectRequest.orders && collectRequest.orders.length > 0 ? (
                                <Grid container spacing={2}>
                                    {collectRequest.orders.map((order) => (
                                        <Grid size={12} key={order.id}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    "&:hover": { boxShadow: 2 },
                                                    transition: "box-shadow 0.3s",
                                                }}
                                            >
                                                <CardContent>
                                                    <Grid container spacing={2} alignItems="center">
                                                        {/* Order ID */}
                                                        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                fontWeight={600}
                                                            >
                                                                ORDER ID
                                                            </Typography>
                                                            <Typography
                                                                variant="h6"
                                                                fontWeight={600}
                                                                color="primary.main"
                                                            >
                                                                #{order.id}
                                                            </Typography>
                                                        </Grid>

                                                        {/* Patient */}
                                                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                fontWeight={600}
                                                            >
                                                                PATIENT
                                                            </Typography>
                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                                alignItems="center"
                                                                sx={{ mt: 0.5 }}
                                                            >
                                                                <Avatar
                                                                    sx={{
                                                                        width: 32,
                                                                        height: 32,
                                                                        bgcolor: "secondary.main",
                                                                    }}
                                                                >
                                                                    <Person fontSize="small" />
                                                                </Avatar>
                                                                <Typography
                                                                    variant="body1"
                                                                    fontWeight={500}
                                                                >
                                                                    {order.patient?.fullName ||
                                                                        "N/A"}
                                                                </Typography>
                                                            </Stack>
                                                        </Grid>

                                                        {/* Samples Count */}
                                                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                fontWeight={600}
                                                            >
                                                                SAMPLES
                                                            </Typography>
                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                                alignItems="center"
                                                                sx={{ mt: 0.5 }}
                                                            >
                                                                <Vaccines
                                                                    color="primary"
                                                                    fontSize="small"
                                                                />
                                                                <Typography
                                                                    variant="h6"
                                                                    fontWeight={600}
                                                                >
                                                                    {order.samples?.length || 0}
                                                                </Typography>
                                                            </Stack>
                                                        </Grid>

                                                        {/* Tests */}
                                                        <Grid size={{ xs: 12, md: 3 }}>
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                fontWeight={600}
                                                            >
                                                                TESTS ({order.tests?.length || 0})
                                                            </Typography>
                                                            <Box
                                                                sx={{
                                                                    display: "flex",
                                                                    flexWrap: "wrap",
                                                                    gap: 0.5,
                                                                    mt: 0.5,
                                                                }}
                                                            >
                                                                {order.tests
                                                                    ?.slice(0, 3)
                                                                    .map((test, idx) => (
                                                                        <Chip
                                                                            key={idx}
                                                                            label={
                                                                                test.shortName ||
                                                                                test.name
                                                                            }
                                                                            size="small"
                                                                            icon={<Biotech />}
                                                                            sx={{
                                                                                fontSize: "0.75rem",
                                                                            }}
                                                                        />
                                                                    ))}
                                                                {order.tests?.length > 3 && (
                                                                    <Chip
                                                                        label={`+${order.tests.length - 3} more`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{ fontSize: "0.75rem" }}
                                                                    />
                                                                )}
                                                            </Box>
                                                        </Grid>

                                                        {/* Status */}
                                                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                fontWeight={600}
                                                            >
                                                                STATUS
                                                            </Typography>
                                                            <Box sx={{ mt: 0.5 }}>
                                                                <Chip
                                                                    label={order.status}
                                                                    size="small"
                                                                    color={getStatusColor(
                                                                        order.status
                                                                    )}
                                                                    sx={{ fontWeight: 600 }}
                                                                />
                                                            </Box>
                                                        </Grid>
                                                    </Grid>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Paper variant="outlined" sx={{ p: 3, textAlign: "center", mt: 2 }}>
                                    <Typography color="text.secondary">
                                        No orders found in this collection request
                                    </Typography>
                                </Paper>
                            )}
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Box>
        </AuthenticatedLayout>
    );
};

export default UserShow;
