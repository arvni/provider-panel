import React, { useEffect, useMemo } from "react";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    Paper,
    Stack,
    Typography,
    alpha,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import {
    AcUnit,
    FlagCircle,
    HourglassBottom,
    LocationOn,
    MyLocation,
    PlayCircle,
    QrCode,
    Straighten,
    Timeline,
    TrendingDown,
    TrendingUp,
    Whatshot,
} from "@mui/icons-material";
import {
    Area,
    CartesianGrid,
    ComposedChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
    buildLogisticsModel,
    formatAccuracy,
    formatDateTime,
    formatDistance,
    formatTime,
    toNumber,
} from "./logisticsUtils";

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
 * Compact labelled metric used across the tracking panel.
 */
export const StatTile = ({ icon, label, value, caption, color = "text.primary" }) => (
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
 * Renders the courier-side tracking a collect request accumulates: the pickup
 * to delivery timeline, sample barcodes, the recorded route and the
 * temperature trace. Shared by the provider and admin detail pages.
 */
const LogisticsTracking = ({ details = {} }) => {
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

    const {
        barcodes,
        startPoint,
        endPoint,
        mapPoints,
        distance,
        duration,
        temperature,
        mapsHref,
        hasTracking,
    } = useMemo(() => buildLogisticsModel(details, isSmall), [details, isSmall]);

    if (!hasTracking) {
        return (
            <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                <Typography color="text.secondary">
                    No tracking information available yet
                </Typography>
            </Paper>
        );
    }

    return (
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
                                        orientation={isSmall ? "horizontal" : "vertical"}
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
                                        <Typography variant="body1" fontWeight={600}>
                                            {formatDateTime(details.started_at)}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Stack spacing={0.5} alignItems="center" sx={{ flex: 1 }}>
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
                                            display: { xs: "none", md: "block" },
                                        }}
                                    />
                                </Stack>

                                <Stack
                                    direction="row"
                                    spacing={1.5}
                                    alignItems="center"
                                    sx={{ flex: 1 }}
                                    justifyContent={{ xs: "flex-start", md: "flex-end" }}
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
                                        <Typography variant="body1" fontWeight={600}>
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
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Sample Barcodes ({barcodes.length})
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2.5 }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                            <Avatar sx={{ bgcolor: "primary.main" }}>
                                <QrCode />
                            </Avatar>
                            <Box sx={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
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
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                        Route Map
                    </Typography>
                    <Card variant="outlined">
                        <CardContent sx={{ p: 2 }}>
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                {details.starting_location && (
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <StatTile
                                            icon={<MyLocation color="success" fontSize="small" />}
                                            label="START"
                                            value={
                                                formatTime(details.starting_location.timestamp) ||
                                                "—"
                                            }
                                            caption={formatAccuracy(
                                                details.starting_location.accuracy
                                            )}
                                        />
                                    </Grid>
                                )}
                                {details.ending_location && (
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <StatTile
                                            icon={<LocationOn color="error" fontSize="small" />}
                                            label="END"
                                            value={
                                                formatTime(details.ending_location.timestamp) || "—"
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
                                            icon={<Straighten color="primary" fontSize="small" />}
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
                                    "& .leaflet-container": { height: "100%", width: "100%" },
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
                                        <Marker position={startPoint} icon={startIcon}>
                                            <Popup>
                                                <LocationPopup
                                                    title="Start Location"
                                                    color="success.main"
                                                    location={details.starting_location}
                                                />
                                            </Popup>
                                        </Marker>
                                    )}

                                    {endPoint && (
                                        <Marker position={endPoint} icon={endIcon}>
                                            <Popup>
                                                <LocationPopup
                                                    title="End Location"
                                                    color="error.main"
                                                    location={details.ending_location}
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
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
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
                                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                                    borderRadius: 1,
                                }}
                            >
                                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                    <StatTile
                                        icon={<Timeline fontSize="small" color="disabled" />}
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
                                        icon={<AcUnit fontSize="small" color="info" />}
                                        label="MIN"
                                        value={`${temperature.min.toFixed(2)}°C`}
                                        color="info.main"
                                    />
                                </Grid>
                                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                    <StatTile
                                        icon={<Whatshot fontSize="small" color="error" />}
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
                                        value={`${(temperature.max - temperature.min).toFixed(2)}°C`}
                                        caption="max − min"
                                    />
                                </Grid>
                                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                    <StatTile
                                        icon={
                                            temperature.drift >= 0 ? (
                                                <TrendingUp fontSize="small" color="error" />
                                            ) : (
                                                <TrendingDown fontSize="small" color="info" />
                                            )
                                        }
                                        label="START → END"
                                        value={`${temperature.drift >= 0 ? "+" : "−"}${Math.abs(
                                            temperature.drift
                                        ).toFixed(2)}°C`}
                                        color={temperature.drift >= 0 ? "error.main" : "info.main"}
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
                                        margin={{ top: 10, right: 24, left: 0, bottom: 8 }}
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
                                                    stopColor={theme.palette.primary.main}
                                                    stopOpacity={0.35}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor={theme.palette.primary.main}
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
                                            stroke={theme.palette.text.secondary}
                                        />
                                        <YAxis
                                            domain={temperature.domain}
                                            width={64}
                                            tickFormatter={(value) => `${value.toFixed(1)}°`}
                                            tick={{ fontSize: 12 }}
                                            stroke={theme.palette.text.secondary}
                                        />
                                        <Tooltip
                                            cursor={{ stroke: theme.palette.divider }}
                                            content={({ active, payload }) => {
                                                if (!active || !payload?.length) return null;
                                                const point = payload[0].payload;
                                                return (
                                                    <Paper elevation={3} sx={{ p: 1.5 }}>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            {formatDateTime(point.timestamp)}
                                                        </Typography>
                                                        <Typography
                                                            variant="h6"
                                                            fontWeight={700}
                                                            color="primary.main"
                                                        >
                                                            {point.temperature.toFixed(2)}°C
                                                        </Typography>
                                                    </Paper>
                                                );
                                            }}
                                        />

                                        <ReferenceLine
                                            y={temperature.average}
                                            stroke={theme.palette.text.secondary}
                                            strokeDasharray="2 6"
                                            label={{
                                                value: `avg ${temperature.average.toFixed(2)}°C`,
                                                position: "insideLeft",
                                                fill: theme.palette.text.secondary,
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
                                                    index === temperature.minIndex ||
                                                    index === temperature.maxIndex;
                                                return (
                                                    <circle
                                                        key={index}
                                                        cx={cx}
                                                        cy={cy}
                                                        r={isPeak ? 4 : 2}
                                                        fill={theme.palette.primary.main}
                                                        stroke={
                                                            isPeak
                                                                ? theme.palette.primary.dark
                                                                : undefined
                                                        }
                                                        strokeWidth={isPeak ? 2 : 0}
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
                                <Typography variant="caption" color="text.secondary">
                                    {temperature.series.length} readings from{" "}
                                    {formatDateTime(temperature.from)} to{" "}
                                    {formatDateTime(temperature.to)}
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            )}
        </Grid>
    );
};

export default LogisticsTracking;
