import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Avatar,
    Card,
    CardHeader,
    CardContent,
    useTheme,
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
    Email,
    ArrowBack,
    Biotech,
    Vaccines,
    Thermostat,
    MyLocation,
    AccessTime,
    QrCode,
    Timeline,
    ExpandMore,
    Info,
    Map,
} from "@mui/icons-material";
import { router } from "@inertiajs/react";
import PageHeader from "@/Components/PageHeader";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
    Area,
    ComposedChart,
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons for Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

/**
 * User CollectRequest Show component
 * Displays detailed information about a collection request (read-only for users)
 */
const UserShow = ({ collectRequest }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(['details', 'tracking', 'orders']);

    /**
     * Handle accordion change
     */
    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(prev =>
            isExpanded
                ? [...prev, panel]
                : prev.filter(p => p !== panel)
        );
    };

    /**
     * Handle back navigation
     */
    const handleBack = () => {
        router.get(route("collectRequests.index"));
    };

    /**
     * Format date string
     */
    const formatDate = (dateString) => {
        if (!dateString) return "Not specified";
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateString || "Not specified";
        }
    };

    /**
     * Format date and time string
     */
    const formatDateTime = (dateString) => {
        if (!dateString) return "Not specified";
        try {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString || "Not specified";
        }
    };

    /**
     * Get status chip color based on status
     */
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'requested':
                return 'warning';
            case 'scheduled':
                return 'info';
            case 'picked_up':
            case 'picked up':
                return 'primary';
            case 'received':
                return 'success';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    /**
     * Get status label
     */
    const getStatusLabel = (status) => {
        const labelMap = {
            'requested': 'Requested',
            'scheduled': 'Scheduled',
            'picked_up': 'Picked Up',
            'received': 'Received',
            'cancelled': 'Cancelled',
        };
        return labelMap[status?.toLowerCase()] || status;
    };

    const details = collectRequest.details || {};

    return (
        <AuthenticatedLayout>
            <PageHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h5" component="span">
                            Collection Request #{collectRequest.id}
                        </Typography>
                        <Chip
                            label={getStatusLabel(collectRequest.status)}
                            color={getStatusColor(collectRequest.status)}
                            size="medium"
                            sx={{
                                fontWeight: 600,
                                textTransform: 'capitalize',
                            }}
                        />
                    </Box>
                }
                action={
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={handleBack}
                    >
                        Back to List
                    </Button>
                }
            />

            <Box>
                {/* Accordion 1: Collection Details */}
                <Accordion
                    expanded={expanded.includes('details')}
                    onChange={handleAccordionChange('details')}
                    sx={{ mb: 2, boxShadow: theme.shadows[2] }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMore />}
                        sx={{
                            bgcolor: 'primary.lighter',
                            '&:hover': { bgcolor: 'primary.light' }
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
                                    <Grid item xs={12}>
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                bgcolor: 'primary.lighter',
                                                borderColor: 'primary.main',
                                                borderWidth: 2
                                            }}
                                        >
                                            <CardContent>
                                                <Grid container spacing={3}>
                                                    <Grid item xs={12} sm={6} md={3}>
                                                        <Stack spacing={0.5}>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Event color="primary" fontSize="small" />
                                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                    PREFERRED DATE
                                                                </Typography>
                                                            </Stack>
                                                            <Typography variant="body1" fontWeight={600}>
                                                                {formatDate(collectRequest.preferred_date)}
                                                            </Typography>
                                                        </Stack>
                                                    </Grid>

                                                    {details.started_at && (
                                                        <Grid item xs={12} sm={6} md={3}>
                                                            <Stack spacing={0.5}>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <LocalShipping color="success" fontSize="small" />
                                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                        ACTUAL PICKUP
                                                                    </Typography>
                                                                </Stack>
                                                                <Typography variant="body1" fontWeight={600} color="success.main">
                                                                    {formatDateTime(details.started_at)}
                                                                </Typography>
                                                            </Stack>
                                                        </Grid>
                                                    )}

                                                    {(details.collection_date || details.collection_time) && (
                                                        <Grid item xs={12} sm={6} md={3}>
                                                            <Stack spacing={0.5}>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <Schedule color="primary" fontSize="small" />
                                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                        SCHEDULED
                                                                    </Typography>
                                                                </Stack>
                                                                <Typography variant="body1" fontWeight={600}>
                                                                    {details.collection_date && formatDate(details.collection_date)}
                                                                    {details.collection_time && ` at ${details.collection_time}`}
                                                                </Typography>
                                                            </Stack>
                                                        </Grid>
                                                    )}

                                                    <Grid item xs={12} sm={6} md={3}>
                                                        <Stack spacing={0.5}>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Receipt color="primary" fontSize="small" />
                                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                    TOTAL ORDERS
                                                                </Typography>
                                                            </Stack>
                                                            <Typography variant="body1" fontWeight={600}>
                                                                {collectRequest.orders?.length || 0} Order{collectRequest.orders?.length !== 1 ? 's' : ''}
                                                            </Typography>
                                                        </Stack>
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    {/* Contact Information Section */}
                                    {(details.address || details.phone) && (
                                        <Grid item xs={12}>
                                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                                                Contact Information
                                            </Typography>
                                            <Grid container spacing={2}>
                                                {details.address && (
                                                    <Grid item xs={12} md={details.phone ? 8 : 12}>
                                                        <Paper variant="outlined" sx={{ p: 2.5 }}>
                                                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                                                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                                                    <LocationOn />
                                                                </Avatar>
                                                                <Box>
                                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
                                                    <Grid item xs={12} md={details.address ? 4 : 12}>
                                                        <Paper variant="outlined" sx={{ p: 2.5 }}>
                                                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                                                <Avatar sx={{ bgcolor: 'success.main' }}>
                                                                    <Phone />
                                                                </Avatar>
                                                                <Box>
                                                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                        Contact Phone
                                                                    </Typography>
                                                                    <Typography variant="body1" fontWeight={500}>
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
                                        <Grid item xs={12}>
                                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                                                Additional Notes
                                            </Typography>
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    p: 2.5,
                                                    bgcolor: 'warning.lighter',
                                                    borderColor: 'warning.main'
                                                }}
                                            >
                                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                                    <Avatar sx={{ bgcolor: 'warning.main' }}>
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
                    expanded={expanded.includes('tracking')}
                    onChange={handleAccordionChange('tracking')}
                    sx={{ mb: 2, boxShadow: theme.shadows[2] }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMore />}
                        sx={{
                            bgcolor: 'success.lighter',
                            '&:hover': { bgcolor: 'success.light' }
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Timeline color="success" />
                            <Typography variant="h6" fontWeight={600}>
                                Logistics Tracking
                            </Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={3}>
                                    {/* Barcodes */}
                                    {details.barcodes && details.barcodes.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                                Sample Barcodes ({details.barcodes.length})
                                            </Typography>
                                            <Paper variant="outlined" sx={{ p: 2.5 }}>
                                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                        <QrCode />
                                                    </Avatar>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                            {details.barcodes.map((barcode, idx) => (
                                                                <Chip
                                                                    key={idx}
                                                                    label={barcode}
                                                                    variant="filled"
                                                                    color="primary"
                                                                    sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.875rem' }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                </Stack>
                                            </Paper>
                                        </Grid>
                                    )}

                                    {/* Location Tracking */}
                                    {(details.starting_location || details.ending_location) && (
                                        <Grid item xs={12}>
                                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                                                Route Map
                                            </Typography>
                                            <Card variant="outlined">
                                                <CardContent sx={{ p: 2 }}>
                                                    <Box sx={{ width: '100%', height: 450, mb: 2, borderRadius: 2, overflow: 'hidden', '& .leaflet-container': { height: '100%', width: '100%' } }}>
                                                        <MapContainer
                                                            center={(() => {
                                                                if (details.starting_location && details.ending_location) {
                                                                    const centerLat = (parseFloat(details.starting_location.latitude) + parseFloat(details.ending_location.latitude)) / 2;
                                                                    const centerLng = (parseFloat(details.starting_location.longitude) + parseFloat(details.ending_location.longitude)) / 2;
                                                                    return [centerLat, centerLng];
                                                                } else if (details.starting_location) {
                                                                    return [parseFloat(details.starting_location.latitude), parseFloat(details.starting_location.longitude)];
                                                                } else {
                                                                    return [parseFloat(details.ending_location.latitude), parseFloat(details.ending_location.longitude)];
                                                                }
                                                            })()}
                                                            zoom={details.starting_location && details.ending_location ? 13 : 15}
                                                            style={{ height: '100%', width: '100%' }}
                                                        >
                                                            <TileLayer
                                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                            />

                                                            {details.starting_location && (
                                                                <Marker
                                                                    position={[parseFloat(details.starting_location.latitude), parseFloat(details.starting_location.longitude)]}
                                                                    icon={startIcon}
                                                                >
                                                                    <Popup>
                                                                        <Box sx={{ minWidth: 200 }}>
                                                                            <Typography variant="subtitle2" fontWeight={600} color="success.main">
                                                                                Start Location
                                                                            </Typography>
                                                                            <Typography variant="body2">
                                                                                Lat: {details.starting_location.latitude}
                                                                            </Typography>
                                                                            <Typography variant="body2">
                                                                                Long: {details.starting_location.longitude}
                                                                            </Typography>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                Accuracy: {details.starting_location.accuracy}m
                                                                            </Typography>
                                                                        </Box>
                                                                    </Popup>
                                                                </Marker>
                                                            )}

                                                            {details.ending_location && (
                                                                <Marker
                                                                    position={[parseFloat(details.ending_location.latitude), parseFloat(details.ending_location.longitude)]}
                                                                    icon={endIcon}
                                                                >
                                                                    <Popup>
                                                                        <Box sx={{ minWidth: 200 }}>
                                                                            <Typography variant="subtitle2" fontWeight={600} color="error.main">
                                                                                End Location
                                                                            </Typography>
                                                                            <Typography variant="body2">
                                                                                Lat: {details.ending_location.latitude}
                                                                            </Typography>
                                                                            <Typography variant="body2">
                                                                                Long: {details.ending_location.longitude}
                                                                            </Typography>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                Accuracy: {details.ending_location.accuracy}m
                                                                            </Typography>
                                                                        </Box>
                                                                    </Popup>
                                                                </Marker>
                                                            )}

                                                            {details.starting_location && details.ending_location && (
                                                                <Polyline
                                                                    positions={[
                                                                        [parseFloat(details.starting_location.latitude), parseFloat(details.starting_location.longitude)],
                                                                        [parseFloat(details.ending_location.latitude), parseFloat(details.ending_location.longitude)]
                                                                    ]}
                                                                    color="blue"
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
                                                        href={(() => {
                                                            if (details.starting_location && details.ending_location) {
                                                                return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${details.starting_location.latitude}%2C${details.starting_location.longitude}%3B${details.ending_location.latitude}%2C${details.ending_location.longitude}`;
                                                            } else if (details.starting_location) {
                                                                return `https://www.openstreetmap.org/?mlat=${details.starting_location.latitude}&mlon=${details.starting_location.longitude}#map=15/${details.starting_location.latitude}/${details.starting_location.longitude}`;
                                                            } else {
                                                                return `https://www.openstreetmap.org/?mlat=${details.ending_location.latitude}&mlon=${details.ending_location.longitude}#map=15/${details.ending_location.latitude}/${details.ending_location.longitude}`;
                                                            }
                                                        })()}
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
                                    {details.temperature_logs && details.temperature_logs.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                                                Temperature Monitoring
                                            </Typography>
                                            <Card variant="outlined">
                                                <CardContent sx={{ p: 2 }}>
                                                    <Stack direction="row" spacing={3} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                READINGS
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight={600}>
                                                                {details.temperature_logs.length}
                                                            </Typography>
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                MIN
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight={600} color="info.main">
                                                                {Math.min(...details.temperature_logs.map(log => parseFloat(log.value)))}°C
                                                            </Typography>
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                MAX
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight={600} color="error.main">
                                                                {Math.max(...details.temperature_logs.map(log => parseFloat(log.value)))}°C
                                                            </Typography>
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                AVG
                                                            </Typography>
                                                            <Typography variant="h6" fontWeight={600}>
                                                                {(details.temperature_logs.map(log => parseFloat(log.value)).reduce((a, b) => a + b, 0) / details.temperature_logs.length).toFixed(2)}°C
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                    <Box sx={{ width: '100%', height: 400 }}>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <ComposedChart
                                                                data={details.temperature_logs.map(log => ({
                                                                    time: new Date(log.timestamp).toLocaleString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    }),
                                                                    temperature: parseFloat(log.value),
                                                                    timestamp: log.timestamp
                                                                }))}
                                                                margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
                                                            >
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis
                                                                    dataKey="time"
                                                                    angle={-45}
                                                                    textAnchor="end"
                                                                    height={80}
                                                                    tick={{ fontSize: 12 }}
                                                                />
                                                                <YAxis
                                                                    label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
                                                                    domain={['auto', 'auto']}
                                                                />
                                                                <Tooltip
                                                                    content={({ active, payload }) => {
                                                                        if (active && payload && payload.length) {
                                                                            const temp = payload[0].value;
                                                                            const isOutOfRange = temp > 8 || temp < -80;
                                                                            return (
                                                                                <Paper sx={{ p: 1.5, bgcolor: 'background.paper' }}>
                                                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                                        {payload[0].payload.time}
                                                                                    </Typography>
                                                                                    <Typography
                                                                                        variant="body2"
                                                                                        sx={{
                                                                                            color: isOutOfRange ? 'error.main' : 'primary.main',
                                                                                            fontWeight: isOutOfRange ? 600 : 400
                                                                                        }}
                                                                                    >
                                                                                        {temp}°C
                                                                                        {isOutOfRange && ' ⚠️ Out of range'}
                                                                                    </Typography>
                                                                                </Paper>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    }}
                                                                />
                                                                <Legend wrapperStyle={{ paddingTop: '20px' }} />

                                                                {/* Safe temperature range area */}
                                                                <ReferenceLine y={8} stroke="#ff9800" strokeDasharray="5 5" label={{ value: 'Max Safe (8°C)', position: 'right', fill: '#ff9800', fontSize: 12 }} />
                                                                <ReferenceLine y={-80} stroke="#2196f3" strokeDasharray="5 5" label={{ value: 'Min Safe (-80°C)', position: 'right', fill: '#2196f3', fontSize: 12 }} />

                                                                {/* Temperature line */}
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey="temperature"
                                                                    stroke={theme.palette.primary.main}
                                                                    strokeWidth={2}
                                                                    dot={(props) => {
                                                                        const { cx, cy, payload } = props;
                                                                        const temp = payload.temperature;
                                                                        const isOutOfRange = temp > 8 || temp < -80;
                                                                        return (
                                                                            <circle
                                                                                cx={cx}
                                                                                cy={cy}
                                                                                r={4}
                                                                                fill={isOutOfRange ? theme.palette.error.main : theme.palette.primary.main}
                                                                                stroke={isOutOfRange ? theme.palette.error.dark : theme.palette.primary.dark}
                                                                                strokeWidth={2}
                                                                            />
                                                                        );
                                                                    }}
                                                                    name="Temperature"
                                                                />
                                                            </ComposedChart>
                                                        </ResponsiveContainer>
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                                                        * Red dots indicate temperature outside safe range (-80°C to 8°C)
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    )}

                                    {/* No tracking data message */}
                                    {!details.barcodes && !details.starting_location && !details.ending_location &&
                                     !details.temperature_logs && (
                                        <Grid item xs={12}>
                                            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
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
                    expanded={expanded.includes('orders')}
                    onChange={handleAccordionChange('orders')}
                    sx={{ mb: 2, boxShadow: theme.shadows[2] }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMore />}
                        sx={{
                            bgcolor: 'warning.lighter',
                            '&:hover': { bgcolor: 'warning.light' }
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
                                            <Grid item xs={12} key={order.id}>
                                                <Card variant="outlined" sx={{ '&:hover': { boxShadow: 2 }, transition: 'box-shadow 0.3s' }}>
                                                    <CardContent>
                                                        <Grid container spacing={2} alignItems="center">
                                                            {/* Order ID */}
                                                            <Grid item xs={12} sm={6} md={2}>
                                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                    ORDER ID
                                                                </Typography>
                                                                <Typography variant="h6" fontWeight={600} color="primary.main">
                                                                    #{order.id}
                                                                </Typography>
                                                            </Grid>

                                                            {/* Patient */}
                                                            <Grid item xs={12} sm={6} md={3}>
                                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                    PATIENT
                                                                </Typography>
                                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                                                        <Person fontSize="small" />
                                                                    </Avatar>
                                                                    <Typography variant="body1" fontWeight={500}>
                                                                        {order.patient?.fullName || 'N/A'}
                                                                    </Typography>
                                                                </Stack>
                                                            </Grid>

                                                            {/* Samples Count */}
                                                            <Grid item xs={6} sm={4} md={2}>
                                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                    SAMPLES
                                                                </Typography>
                                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                                                    <Vaccines color="primary" fontSize="small" />
                                                                    <Typography variant="h6" fontWeight={600}>
                                                                        {order.samples?.length || 0}
                                                                    </Typography>
                                                                </Stack>
                                                            </Grid>

                                                            {/* Tests */}
                                                            <Grid item xs={12} md={3}>
                                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                    TESTS ({order.tests?.length || 0})
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                                    {order.tests?.slice(0, 3).map((test, idx) => (
                                                                        <Chip
                                                                            key={idx}
                                                                            label={test.shortName || test.name}
                                                                            size="small"
                                                                            icon={<Biotech />}
                                                                            sx={{ fontSize: '0.75rem' }}
                                                                        />
                                                                    ))}
                                                                    {order.tests?.length > 3 && (
                                                                        <Chip
                                                                            label={`+${order.tests.length - 3} more`}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{ fontSize: '0.75rem' }}
                                                                        />
                                                                    )}
                                                                </Box>
                                                            </Grid>

                                                            {/* Status */}
                                                            <Grid item xs={6} sm={4} md={2}>
                                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                    STATUS
                                                                </Typography>
                                                                <Box sx={{ mt: 0.5 }}>
                                                                    <Chip
                                                                        label={order.status}
                                                                        size="small"
                                                                        color={getStatusColor(order.status)}
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
                                    <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', mt: 2 }}>
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
