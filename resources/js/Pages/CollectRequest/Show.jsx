import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
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
    Tooltip,
    Typography,
    Avatar,
    Card,
    CardHeader,
    CardContent,
} from "@mui/material";
import {
    Download,
    Edit as EditIcon,
    EditNote,
    Email,
    Flag,
    LocationCity,
    LocationSearching,
    Person,
    Phone,
    RemoveRedEye,
    Streetview,
    Schedule,
    Notes,
    Receipt,
    LocalShipping,
    Event,
    AssignmentReturn,
    ListAlt,
    CloudDone,
    CloudOff,
    CloudSync,
    Inventory2,
    Send,
    Tag,
    Vaccines,
    Biotech,
    QrCode,
} from "@mui/icons-material";
import { useForm, router } from "@inertiajs/react";
import Form from "./Components/Form";
import LogisticsTracking from "./Components/LogisticsTracking";
import { kitLabel, requestedKits } from "./kits";
import DeleteButton from "@/Components/DeleteButton.jsx";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Tab from "@mui/material/Tab";

/**
 * CollectRequest Show component
 * Displays detailed information about a collection request
 *
 * @param {Object} props Component props
 * @param {Object} props.collectRequest Collection request data
 * @returns {JSX.Element} Rendered component
 */
const Show = ({ collectRequest }) => {
    // Form state for editing
    const { data, setData, post, reset, errors, processing } = useForm({
        ...collectRequest.details,
        status: collectRequest.status,
        _method: "put",
    });

    // State for edit dialog, send dialog, and tab panel
    const [openEdit, setOpenEdit] = useState(false);
    const [openSend, setOpenSend] = useState(false);
    const [activeTab, setActiveTab] = useState("1");

    // Samples tagged to this collect request, with the order/tests each one was
    // collected for (a request may cover only part of an order's samples).
    const samples = collectRequest.samples ?? [];

    // Sample types declared on a request raised without an order.
    // Requests raised without an order: newer ones name the kits, older ones
    // the sample types that were waiting for pickup.
    const requestedSampleTypes = collectRequest.details?.sample_types ?? [];
    const kits = requestedKits(collectRequest.details);
    const isStandalone = collectRequest.details?.type === "standalone";
    // Kit orders reach the lab as order materials, never through the logistics
    // endpoint, so the sync affordances do not apply to them.
    const isKitOrder = collectRequest.details?.mode === "order";
    const materialIds = kits.map((kit) => kit.order_material_id).filter(Boolean);

    const handleSendToServer = () => {
        setOpenSend(false);
        router.post(
            route("admin.collectRequests.send", collectRequest.id),
            {},
            { preserveScroll: true }
        );
    };

    /**
     * Open edit form dialog
     */
    const openEditForm = () => setOpenEdit(true);

    /**
     * Close edit form dialog and reset form
     */
    const handleClose = () => {
        setOpenEdit(false);
        reset();
    };

    /**
     * Submit edit form
     */
    const handleSubmit = () => {
        post(route("admin.collectRequests.update", collectRequest.id), {
            onSuccess: handleClose,
        });
    };

    /**
     * Handle tab change
     *
     * @param {Event} event Tab change event
     * @param {string} newValue New tab value
     */
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    /**
     * Format date string
     *
     * @param {string} dateString Date string to format
     * @returns {string} Formatted date or "Not specified"
     */
    const formatDate = (dateString) => {
        if (!dateString) return "Not specified";

        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString || "Not specified";
        }
    };

    /**
     * Get status chip color based on status
     *
     * @param {string} status Status value
     * @returns {string} Color name
     */
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return "warning";
            case "scheduled":
                return "info";
            case "picked up":
                return "secondary";
            case "received":
                return "success";
            case "cancelled":
                return "error";
            case "completed":
                return "success";
            default:
                return "default";
        }
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
            {/* Header: title, status, actions */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                    flexWrap: "wrap",
                    gap: 2,
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <Typography variant="h5" component="h1">
                        Logistic Request #{collectRequest.id}
                    </Typography>
                    <Chip
                        label={collectRequest.status}
                        color={getStatusColor(collectRequest.status)}
                        sx={{ fontWeight: "medium", textTransform: "capitalize" }}
                    />
                    {/* Server sync badge. A kit order never syncs here — the
                        order material it created is what reaches the lab. */}
                    {isKitOrder ? (
                        <Chip
                            icon={<Inventory2 fontSize="small" />}
                            label="Syncs as an order material"
                            size="small"
                            color="info"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                        />
                    ) : collectRequest.server_id ? (
                        <Tooltip title={`Server ID: ${collectRequest.server_id}`}>
                            <Chip
                                icon={<CloudDone fontSize="small" />}
                                label={`Synced · #${collectRequest.server_id}`}
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                            />
                        </Tooltip>
                    ) : (
                        <Chip
                            icon={<CloudOff fontSize="small" />}
                            label="Not sent to server"
                            size="small"
                            color="warning"
                            variant="outlined"
                        />
                    )}
                </Stack>

                <Stack direction="row" spacing={1}>
                    {!collectRequest.server_id && !isKitOrder && (
                        <Button
                            variant="outlined"
                            color="success"
                            startIcon={<CloudSync />}
                            onClick={() => setOpenSend(true)}
                            size="small"
                        >
                            Send to Server
                        </Button>
                    )}
                    {collectRequest.status !== "received" && (
                        <Button
                            variant="contained"
                            startIcon={<EditNote />}
                            onClick={openEditForm}
                            color="primary"
                            size="small"
                        >
                            Edit Details
                        </Button>
                    )}
                </Stack>
            </Box>

            {/* Server sync info banner */}
            {isKitOrder ? (
                <Alert icon={<Inventory2 />} severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    This is a kit order, so there is nothing to send to the logistics endpoint. The
                    lab receives it as order material
                    {materialIds.length > 0 ? (
                        <>
                            {materialIds.length > 1 ? "s " : " "}
                            <strong>{materialIds.map((id) => `#${id}`).join(", ")}</strong>
                        </>
                    ) : null}
                    , which {materialIds.length > 1 ? "sync on their own" : "syncs on its own"}.
                </Alert>
            ) : collectRequest.server_id ? (
                <Alert icon={<CloudDone />} severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                    This collection request has been synced to the main server with ID{" "}
                    <strong>#{collectRequest.server_id}</strong>. Status updates will be received
                    automatically via webhook.
                </Alert>
            ) : (
                <Alert
                    icon={<CloudOff />}
                    severity="warning"
                    sx={{ mb: 3, borderRadius: 2 }}
                    action={
                        <Button
                            color="warning"
                            size="small"
                            startIcon={<Send />}
                            onClick={() => setOpenSend(true)}
                        >
                            Send Now
                        </Button>
                    }
                >
                    This collection request has not been sent to the main server yet. The lab will
                    not receive it until it is synced.
                </Alert>
            )}

            {/* Main content tabs */}
            <TabContext value={activeTab}>
                <Paper
                    elevation={0}
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        overflow: "hidden",
                        mb: 4,
                    }}
                >
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <TabList
                            onChange={handleTabChange}
                            aria-label="collection request tabs"
                            sx={{ px: 2 }}
                        >
                            <Tab
                                label="Details"
                                value="1"
                                icon={<ListAlt />}
                                iconPosition="start"
                            />
                            <Tab
                                label="Customer Information"
                                value="2"
                                icon={<Person />}
                                iconPosition="start"
                            />
                            <Tab label="Orders" value="3" icon={<Receipt />} iconPosition="start" />
                            <Tab
                                label={`Samples (${samples.length})`}
                                value="4"
                                icon={<Vaccines />}
                                iconPosition="start"
                            />
                        </TabList>
                    </Box>

                    {/* Tab 1: Collection Details */}
                    <TabPanel value="1" sx={{ p: 0 }}>
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Logistics Information
                            </Typography>

                            <Grid container spacing={3}>
                                {/* Server sync card */}
                                <Grid size={12}>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            borderColor: isKitOrder
                                                ? "info.light"
                                                : collectRequest.server_id
                                                  ? "success.light"
                                                  : "warning.light",
                                        }}
                                    >
                                        <CardHeader
                                            title="Server Synchronization"
                                            subheader={
                                                isKitOrder
                                                    ? "Kit orders are sent as an order material, not through the logistics endpoint."
                                                    : collectRequest.server_id
                                                      ? "This request has been successfully sent to the main server."
                                                      : "This request has not been sent to the main server yet."
                                            }
                                            avatar={
                                                <Avatar
                                                    sx={{
                                                        bgcolor: isKitOrder
                                                            ? "info.main"
                                                            : collectRequest.server_id
                                                              ? "success.main"
                                                              : "warning.main",
                                                    }}
                                                >
                                                    {isKitOrder ? (
                                                        <Inventory2 />
                                                    ) : collectRequest.server_id ? (
                                                        <CloudDone />
                                                    ) : (
                                                        <CloudOff />
                                                    )}
                                                </Avatar>
                                            }
                                            action={
                                                !collectRequest.server_id &&
                                                !isKitOrder && (
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        startIcon={<CloudSync />}
                                                        onClick={() => setOpenSend(true)}
                                                        sx={{ mt: 1, mr: 1 }}
                                                    >
                                                        Send to Server
                                                    </Button>
                                                )
                                            }
                                        />
                                        {collectRequest.server_id && (
                                            <>
                                                <Divider />
                                                <CardContent>
                                                    <List disablePadding>
                                                        <ListItem>
                                                            <ListItemAvatar>
                                                                <Avatar
                                                                    sx={{
                                                                        bgcolor: "success.light",
                                                                    }}
                                                                >
                                                                    <Tag />
                                                                </Avatar>
                                                            </ListItemAvatar>
                                                            <ListItemText
                                                                primary="Server ID"
                                                                secondary={`#${collectRequest.server_id}`}
                                                                slotProps={{
                                                                    secondary: {
                                                                        sx: {
                                                                            fontWeight: 600,
                                                                            color: "success.dark",
                                                                            fontSize: "1rem",
                                                                        },
                                                                    },
                                                                }}
                                                            />
                                                        </ListItem>
                                                    </List>
                                                </CardContent>
                                            </>
                                        )}
                                    </Card>
                                </Grid>
                                {/* Requested sample types: only present on requests
                                    raised without an order, where they (and the
                                    provider's comment) are all that was asked for. */}
                                {isStandalone && (
                                    <Grid size={12}>
                                        <Card variant="outlined">
                                            <CardHeader
                                                title={
                                                    kits.length === 0
                                                        ? "Requested Sample Types"
                                                        : kits.length === 1
                                                          ? "Requested Kit"
                                                          : "Requested Kits"
                                                }
                                                subheader="Requested without an order"
                                                avatar={
                                                    <Avatar sx={{ bgcolor: "primary.main" }}>
                                                        <Vaccines />
                                                    </Avatar>
                                                }
                                            />
                                            <Divider />
                                            <CardContent>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    useFlexGap
                                                    flexWrap="wrap"
                                                >
                                                    {kits.map((kit, index) => (
                                                        <Chip
                                                            key={
                                                                kit.order_material_id ??
                                                                kit.id ??
                                                                index
                                                            }
                                                            color="primary"
                                                            label={kitLabel(kit)}
                                                            variant="outlined"
                                                        />
                                                    ))}
                                                    {/* Older requests named the sample types
                                                        waiting for pickup instead of kits. */}
                                                    {requestedSampleTypes.map(
                                                        (sampleType, index) => (
                                                            <Chip
                                                                key={sampleType.id ?? index}
                                                                label={sampleType.name}
                                                                variant="outlined"
                                                            />
                                                        )
                                                    )}
                                                    {kits.length === 0 &&
                                                        requestedSampleTypes.length === 0 && (
                                                            <Chip
                                                                label="Pickup only — no kit requested"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                </Stack>
                                                {collectRequest?.details?.comment && (
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{ mt: 2 }}
                                                    >
                                                        {collectRequest.details.comment}
                                                    </Typography>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}

                                {/* Scheduling Information */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card variant="outlined">
                                        <CardHeader
                                            title="Scheduled Collection"
                                            avatar={
                                                <Avatar sx={{ bgcolor: "info.main" }}>
                                                    <Schedule />
                                                </Avatar>
                                            }
                                        />
                                        <Divider />
                                        <CardContent>
                                            <List disablePadding>
                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: "info.light" }}>
                                                            <Event />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Date & Time"
                                                        secondary={formatDate(
                                                            collectRequest?.details?.scheduleDate
                                                        )}
                                                    />
                                                </ListItem>

                                                {collectRequest?.details?.scheduledDetails && (
                                                    <ListItem>
                                                        <ListItemAvatar>
                                                            <Avatar sx={{ bgcolor: "info.light" }}>
                                                                <Notes />
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary="Additional Details"
                                                            secondary={
                                                                collectRequest?.details
                                                                    ?.scheduledDetails
                                                            }
                                                        />
                                                    </ListItem>
                                                )}
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Pickup Information */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card variant="outlined">
                                        <CardHeader
                                            title="Pickup Details"
                                            avatar={
                                                <Avatar sx={{ bgcolor: "secondary.main" }}>
                                                    <LocalShipping />
                                                </Avatar>
                                            }
                                        />
                                        <Divider />
                                        <CardContent>
                                            <List disablePadding>
                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: "secondary.light" }}>
                                                            <AssignmentReturn />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Date & Time"
                                                        secondary={formatDate(
                                                            collectRequest?.details?.pickupDate
                                                        )}
                                                    />
                                                </ListItem>

                                                {collectRequest?.details?.["picked upDetails"] && (
                                                    <ListItem>
                                                        <ListItemAvatar>
                                                            <Avatar
                                                                sx={{ bgcolor: "secondary.light" }}
                                                            >
                                                                <Notes />
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary="Additional Details"
                                                            secondary={
                                                                collectRequest?.details?.[
                                                                    "picked upDetails"
                                                                ]
                                                            }
                                                        />
                                                    </ListItem>
                                                )}
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Courier tracking reported back by the webhook. The
                                cards above cover the dates an admin sets by hand;
                                these are the values recorded during the pickup. */}
                            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                                Collection Tracking
                            </Typography>
                            <LogisticsTracking details={collectRequest.details || {}} />
                        </Box>
                    </TabPanel>

                    {/* Tab 2: Customer Information */}
                    <TabPanel value="2" sx={{ p: 0 }}>
                        <Box sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                {/* Billing Information */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card variant="outlined">
                                        <CardHeader
                                            title="Billing Information"
                                            avatar={
                                                <Avatar sx={{ bgcolor: "warning.main" }}>
                                                    <Receipt />
                                                </Avatar>
                                            }
                                            subheader={`Customer: ${collectRequest.user.name}`}
                                        />
                                        <Divider />
                                        <CardContent>
                                            <List disablePadding>
                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: "warning.light" }}>
                                                            <Person />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Name"
                                                        secondary={
                                                            collectRequest?.user?.meta?.billing
                                                                ?.name || "Not specified"
                                                        }
                                                    />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: "warning.light" }}>
                                                            <Email />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Email"
                                                        secondary={
                                                            collectRequest?.user?.meta?.billing
                                                                ?.email || "Not specified"
                                                        }
                                                    />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: "warning.light" }}>
                                                            <Phone />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Phone"
                                                        secondary={
                                                            collectRequest?.user?.meta?.billing
                                                                ?.phone || "Not specified"
                                                        }
                                                    />
                                                </ListItem>

                                                <Divider component="li" variant="inset" />

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: "warning.light" }}>
                                                            <Streetview />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Street Address"
                                                        secondary={
                                                            collectRequest?.user?.meta?.billing
                                                                ?.address || "Not specified"
                                                        }
                                                    />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: "warning.light" }}>
                                                            <LocationCity />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="City"
                                                        secondary={
                                                            collectRequest?.user?.meta?.billing
                                                                ?.city || "Not specified"
                                                        }
                                                    />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: "warning.light" }}>
                                                            <LocationCity />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="State"
                                                        secondary={
                                                            collectRequest?.user?.meta?.billing
                                                                ?.state || "Not specified"
                                                        }
                                                    />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: "warning.light" }}>
                                                            <Flag />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Country"
                                                        secondary={
                                                            collectRequest?.user?.meta?.billing
                                                                ?.country || "Not specified"
                                                        }
                                                    />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: "warning.light" }}>
                                                            <LocationSearching />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Zip/Postal Code"
                                                        secondary={
                                                            collectRequest?.user?.meta?.billing
                                                                ?.zip || "Not specified"
                                                        }
                                                    />
                                                </ListItem>
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Contact Information */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card variant="outlined">
                                        <CardHeader
                                            title="Contact Information"
                                            avatar={
                                                <Avatar sx={{ bgcolor: "success.main" }}>
                                                    <Phone />
                                                </Avatar>
                                            }
                                            subheader="For collection communication"
                                        />
                                        <Divider />
                                        <CardContent>
                                            <List disablePadding>
                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: "success.light" }}>
                                                            <Email />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Email"
                                                        secondary={
                                                            collectRequest?.user?.meta?.contact
                                                                ?.email || "Not specified"
                                                        }
                                                    />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: "success.light" }}>
                                                            <Phone />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Phone"
                                                        secondary={
                                                            collectRequest?.user?.meta?.contact
                                                                ?.phone || "Not specified"
                                                        }
                                                    />
                                                </ListItem>

                                                <Divider component="li" variant="inset" />

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: "success.light" }}>
                                                            <LocationCity />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="City"
                                                        secondary={
                                                            collectRequest?.user?.meta?.contact
                                                                ?.city || "Not specified"
                                                        }
                                                    />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: "success.light" }}>
                                                            <Flag />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Country"
                                                        secondary={
                                                            collectRequest?.user?.meta?.contact
                                                                ?.country || "Not specified"
                                                        }
                                                    />
                                                </ListItem>
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    </TabPanel>

                    {/* Tab 3: Orders List */}
                    <TabPanel value="3" sx={{ p: 0 }}>
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Related Orders
                            </Typography>

                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width="10%">Order ID</TableCell>
                                            <TableCell width="25%">Tests</TableCell>
                                            <TableCell width="10%">Samples</TableCell>
                                            <TableCell width="15%">Status</TableCell>
                                            <TableCell width="20%">Patient</TableCell>
                                            <TableCell width="20%">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {collectRequest.orders.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    align="center"
                                                    sx={{ py: 3 }}
                                                >
                                                    <Typography color="text.secondary">
                                                        No orders found for this collection request
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            collectRequest.orders.map((order) => (
                                                <TableRow key={order.id}>
                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight="medium"
                                                        >
                                                            #{order.id}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {order.tests.map((test) => (
                                                            <Chip
                                                                key={test.id}
                                                                label={test.name}
                                                                size="small"
                                                                sx={{ mr: 0.5, mb: 0.5 }}
                                                            />
                                                        ))}
                                                    </TableCell>
                                                    {/* Samples of this order that belong to this
                                                        request — see the Samples tab for detail. */}
                                                    <TableCell>
                                                        <Tooltip title="Samples collected under this request">
                                                            <Chip
                                                                icon={<Vaccines fontSize="small" />}
                                                                label={order.samples?.length || 0}
                                                                size="small"
                                                                color={
                                                                    order.samples?.length
                                                                        ? "primary"
                                                                        : "default"
                                                                }
                                                                variant="outlined"
                                                                onClick={() => setActiveTab("4")}
                                                            />
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={order.status}
                                                            size="small"
                                                            color={getStatusColor(order.status)}
                                                            sx={{
                                                                fontWeight: "medium",
                                                                textTransform: "capitalize",
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                            alignItems="center"
                                                        >
                                                            <Avatar
                                                                sx={{
                                                                    width: 24,
                                                                    height: 24,
                                                                    bgcolor: "primary.light",
                                                                }}
                                                            >
                                                                <Person fontSize="small" />
                                                            </Avatar>
                                                            <Typography variant="body2">
                                                                {order?.patient?.name}
                                                            </Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={1}>
                                                            <Tooltip title="Download Summary">
                                                                <IconButton
                                                                    href={route(
                                                                        "order-summary",
                                                                        order.id
                                                                    )}
                                                                    target="_blank"
                                                                    size="small"
                                                                    color="primary"
                                                                >
                                                                    <Download fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            <Tooltip title="View Order">
                                                                <IconButton
                                                                    href={route(
                                                                        "orders.show",
                                                                        order.id
                                                                    )}
                                                                    target="_blank"
                                                                    size="small"
                                                                    color="info"
                                                                >
                                                                    <RemoveRedEye fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            {order.editable && (
                                                                <Tooltip title="Edit Order">
                                                                    <IconButton
                                                                        href={route("orders.edit", {
                                                                            order: order.id,
                                                                            step: order.step,
                                                                        })}
                                                                        color="warning"
                                                                        size="small"
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}

                                                            {order.deletable && (
                                                                <DeleteButton
                                                                    url={route(
                                                                        "orders.destroy",
                                                                        order.id
                                                                    )}
                                                                    size="small"
                                                                    IconProps={{
                                                                        fontSize: "small",
                                                                    }}
                                                                />
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </TabPanel>

                    {/* Tab 4: Samples collected under this request */}
                    <TabPanel value="4" sx={{ p: 0 }}>
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Collected Samples
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Only the samples tagged to this collection request are listed — an
                                order may have further samples collected separately.
                            </Typography>

                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width="20%">Sample ID</TableCell>
                                            <TableCell width="15%">Type</TableCell>
                                            <TableCell width="20%">Patient</TableCell>
                                            <TableCell width="15%">Order</TableCell>
                                            <TableCell width="20%">Tests</TableCell>
                                            <TableCell width="10%">Collected</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {samples.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    align="center"
                                                    sx={{ py: 3 }}
                                                >
                                                    <Typography color="text.secondary">
                                                        No samples are linked to this collection
                                                        request
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            samples.map((sample) => {
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
                                                    <TableRow key={sample.id} hover>
                                                        <TableCell>
                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                                alignItems="center"
                                                            >
                                                                <QrCode
                                                                    fontSize="small"
                                                                    color="action"
                                                                />
                                                                <Typography
                                                                    variant="body2"
                                                                    fontWeight="medium"
                                                                >
                                                                    {sample.sampleId ||
                                                                        sample.material?.barcode ||
                                                                        `#${sample.id}`}
                                                                </Typography>
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={
                                                                    sample.sample_type?.name || "—"
                                                                }
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {sample.patient?.fullName || "—"}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            {orderIds.length === 0 ? (
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                >
                                                                    —
                                                                </Typography>
                                                            ) : (
                                                                orderIds.map((orderId) => (
                                                                    <Chip
                                                                        key={orderId}
                                                                        label={`#${orderId}`}
                                                                        size="small"
                                                                        clickable
                                                                        component="a"
                                                                        href={route(
                                                                            "orders.show",
                                                                            orderId
                                                                        )}
                                                                        target="_blank"
                                                                        sx={{ mr: 0.5, mb: 0.5 }}
                                                                    />
                                                                ))
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {tests.length === 0 ? (
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                >
                                                                    —
                                                                </Typography>
                                                            ) : (
                                                                tests.map((test, index) => (
                                                                    <Chip
                                                                        key={`${test.id}-${index}`}
                                                                        icon={
                                                                            <Biotech fontSize="small" />
                                                                        }
                                                                        label={
                                                                            test.shortName ||
                                                                            test.name
                                                                        }
                                                                        size="small"
                                                                        sx={{ mr: 0.5, mb: 0.5 }}
                                                                    />
                                                                ))
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {sample.collectionDate
                                                                    ? formatDate(
                                                                          sample.collectionDate
                                                                      )
                                                                    : "—"}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </TabPanel>
                </Paper>
            </TabContext>

            {/* Edit form dialog */}
            <Form
                open={openEdit}
                values={data}
                setValues={setData}
                submit={handleSubmit}
                errors={errors}
                cancel={handleClose}
                defaultValue={collectRequest}
                processing={processing}
            />

            {/* Send to server confirmation dialog */}
            <Dialog open={openSend} onClose={() => setOpenSend(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CloudSync color="success" />
                    Send to Main Server
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This will queue <strong>Logistic Request #{collectRequest.id}</strong> to be
                        sent to the main server. Once sent, the lab will be notified and the request
                        will receive a server tracking ID. This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setOpenSend(false)} variant="outlined" size="small">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSendToServer}
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<Send />}
                        autoFocus
                    >
                        Send to Server
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

// Breadcrumbs for layout
const breadCrumbs = [
    {
        title: "Logistic Requests",
        link: "/admin/collectRequests",
        icon: <LocalShipping fontSize="small" />,
    },
];

// Layout wrapper
Show.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            ...breadCrumbs,
            {
                title: "Logistic Request #" + page.props.collectRequest.id,
                link: null,
                icon: <Receipt fontSize="small" />,
            },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default Show;
