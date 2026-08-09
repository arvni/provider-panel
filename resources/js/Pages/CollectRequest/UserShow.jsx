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
    const [expanded, setExpanded] = useState(["details", "tracking", "orders"]);

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded((prev) => (isExpanded ? [...prev, panel] : prev.filter((p) => p !== panel)));
    };

    const handleBack = () => {
        router.get(route("collectRequests.index"));
    };

    const details = useMemo(() => collectRequest.details || {}, [collectRequest.details]);

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
