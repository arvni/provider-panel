import React, { useMemo, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    Paper,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import {
    AcUnit,
    ArrowBack,
    Biotech,
    Event,
    ExpandMore,
    Info,
    Inventory2,
    LocalShipping,
    LocationOn,
    Notes,
    Person,
    Phone,
    QrCode,
    Receipt,
    Schedule,
    Timeline,
    Vaccines,
} from "@mui/icons-material";
import { router } from "@inertiajs/react";
import PageHeader from "@/Components/PageHeader";
import LogisticsTracking, { StatTile } from "./Components/LogisticsTracking";
import { kitLabel, requestedKits } from "./kits";
import { buildLogisticsModel, formatDate, formatDateTime } from "./Components/logisticsUtils";

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
 * User CollectRequest Show component
 * Displays detailed information about a collection request (read-only for users)
 */
const UserShow = ({ collectRequest }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(["details", "tracking", "orders", "samples"]);

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded((prev) => (isExpanded ? [...prev, panel] : prev.filter((p) => p !== panel)));
    };

    const handleBack = () => {
        router.get(route("collectRequests.index"));
    };

    const details = useMemo(() => collectRequest.details || {}, [collectRequest.details]);

    // Every sample tagged to this request, whichever order it came from.
    const samples = collectRequest.samples ?? [];

    // Order-less requests only declare the sample types waiting for pickup,
    // with the provider's comment kept alongside them in details.
    // Requests raised before the kit picker replaced the sample type checkboxes
    // still carry the old selection, so both are rendered when present.
    const requestedSampleTypes = details.sample_types ?? [];
    const kits = useMemo(() => requestedKits(details), [details]);
    const notes = collectRequest.notes || details.comment;

    // Only the pieces the summary card and page header need; the tracking panel
    // derives the rest itself.
    const { collector, barcodes, duration, temperature } = useMemo(
        () => buildLogisticsModel(details),
        [details]
    );

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
                            Logistic Request #{collectRequest.id}
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

                                {/* Requested sample types (order-less requests) */}
                                {requestedSampleTypes.length > 0 && (
                                    <Grid size={12}>
                                        <Typography
                                            variant="h6"
                                            gutterBottom
                                            sx={{ fontWeight: 600, mt: 2 }}
                                        >
                                            Requested Sample Types
                                        </Typography>
                                        <Paper variant="outlined" sx={{ p: 2.5 }}>
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                useFlexGap
                                                flexWrap="wrap"
                                            >
                                                {requestedSampleTypes.map((sampleType, index) => (
                                                    <Chip
                                                        key={sampleType.id ?? index}
                                                        icon={<Vaccines />}
                                                        label={sampleType.name}
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                )}

                                {kits.length > 0 && (
                                    <Grid size={12}>
                                        <Typography
                                            variant="h6"
                                            gutterBottom
                                            sx={{ fontWeight: 600, mt: 2 }}
                                        >
                                            {kits.length === 1 ? "Requested Kit" : "Requested Kits"}
                                        </Typography>
                                        <Paper variant="outlined" sx={{ p: 2.5 }}>
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                useFlexGap
                                                flexWrap="wrap"
                                            >
                                                {kits.map((kit, index) => (
                                                    <Chip
                                                        key={
                                                            kit.order_material_id ?? kit.id ?? index
                                                        }
                                                        icon={<Inventory2 />}
                                                        label={kitLabel(kit)}
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                )}

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
                                {notes && (
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
                                                    {notes}
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
                            <LogisticsTracking details={details} />
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

                                                        {/* The samples of this order that belong
                                                            to this request (an order's remaining
                                                            samples may be collected separately). */}
                                                        {order.samples?.length > 0 && (
                                                            <Grid size={12}>
                                                                <Box
                                                                    sx={{
                                                                        display: "flex",
                                                                        flexWrap: "wrap",
                                                                        gap: 0.5,
                                                                        pt: 1,
                                                                        borderTop: 1,
                                                                        borderColor: "divider",
                                                                    }}
                                                                >
                                                                    {order.samples.map((sample) => (
                                                                        <Chip
                                                                            key={sample.id}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            icon={<Vaccines />}
                                                                            label={`${
                                                                                sample.sampleId ||
                                                                                `#${sample.id}`
                                                                            } · ${
                                                                                sample.sample_type
                                                                                    ?.name || "—"
                                                                            }`}
                                                                            sx={{
                                                                                fontFamily:
                                                                                    "monospace",
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </Box>
                                                            </Grid>
                                                        )}
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

                {/* Accordion 4: Samples collected under this request */}
                <Accordion
                    expanded={expanded.includes("samples")}
                    onChange={handleAccordionChange("samples")}
                    sx={{ mb: 2, boxShadow: theme.shadows[2] }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMore />}
                        sx={{
                            bgcolor: "success.lighter",
                            "&:hover": { bgcolor: "success.light" },
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Vaccines color="success" />
                            <Typography variant="h6" fontWeight={600}>
                                Samples ({samples.length})
                            </Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                        <Box sx={{ p: 3 }}>
                            {samples.length > 0 ? (
                                <Grid container spacing={2}>
                                    {samples.map((sample) => {
                                        const orderIds = [
                                            ...new Set(
                                                (sample.order_items ?? [])
                                                    .map((item) => item.order_id)
                                                    .filter(Boolean)
                                            ),
                                        ];
                                        const tests = (sample.order_items ?? [])
                                            .map((item) => item.test)
                                            .filter(Boolean);

                                        return (
                                            <Grid size={{ xs: 12, md: 6 }} key={sample.id}>
                                                <Card variant="outlined" sx={{ height: "100%" }}>
                                                    <CardContent>
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                            alignItems="center"
                                                            flexWrap="wrap"
                                                            useFlexGap
                                                            sx={{ mb: 1.5 }}
                                                        >
                                                            <QrCode color="success" />
                                                            <Typography
                                                                variant="subtitle1"
                                                                fontWeight={600}
                                                                sx={{ fontFamily: "monospace" }}
                                                            >
                                                                {sample.sampleId || `#${sample.id}`}
                                                            </Typography>
                                                            <Chip
                                                                size="small"
                                                                label={
                                                                    sample.sample_type?.name || "—"
                                                                }
                                                                variant="outlined"
                                                            />
                                                        </Stack>

                                                        <Grid container spacing={1.5}>
                                                            <Grid size={{ xs: 12, sm: 6 }}>
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
                                                                    <Person
                                                                        fontSize="small"
                                                                        color="action"
                                                                    />
                                                                    <Typography variant="body2">
                                                                        {sample.patient?.fullName ||
                                                                            "N/A"}
                                                                    </Typography>
                                                                </Stack>
                                                            </Grid>

                                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    fontWeight={600}
                                                                >
                                                                    COLLECTED
                                                                </Typography>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                    alignItems="center"
                                                                    sx={{ mt: 0.5 }}
                                                                >
                                                                    <Event
                                                                        fontSize="small"
                                                                        color="action"
                                                                    />
                                                                    <Typography variant="body2">
                                                                        {sample.collectionDate
                                                                            ? formatDateTime(
                                                                                  sample.collectionDate
                                                                              )
                                                                            : "Not recorded"}
                                                                    </Typography>
                                                                </Stack>
                                                            </Grid>

                                                            <Grid size={12}>
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    fontWeight={600}
                                                                >
                                                                    ORDER &amp; TESTS
                                                                </Typography>
                                                                <Box
                                                                    sx={{
                                                                        display: "flex",
                                                                        flexWrap: "wrap",
                                                                        gap: 0.5,
                                                                        mt: 0.5,
                                                                    }}
                                                                >
                                                                    {orderIds.map((orderId) => (
                                                                        <Chip
                                                                            key={`order-${orderId}`}
                                                                            size="small"
                                                                            color="primary"
                                                                            icon={<Receipt />}
                                                                            label={`#${orderId}`}
                                                                        />
                                                                    ))}
                                                                    {tests.map((test, index) => (
                                                                        <Chip
                                                                            key={`test-${test.id}-${index}`}
                                                                            size="small"
                                                                            icon={<Biotech />}
                                                                            label={
                                                                                test.shortName ||
                                                                                test.name
                                                                            }
                                                                        />
                                                                    ))}
                                                                    {orderIds.length === 0 &&
                                                                        tests.length === 0 && (
                                                                            <Typography
                                                                                variant="body2"
                                                                                color="text.secondary"
                                                                            >
                                                                                Not linked to an
                                                                                order
                                                                            </Typography>
                                                                        )}
                                                                </Box>
                                                            </Grid>
                                                        </Grid>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            ) : (
                                <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                                    <Typography color="text.secondary">
                                        No samples are linked to this collection request
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
