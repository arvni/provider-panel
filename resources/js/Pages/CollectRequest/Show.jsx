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
    Send,
    Tag,
} from "@mui/icons-material";
import { useForm, router } from "@inertiajs/react";
import Form from "./Components/Form";
import DeleteButton from "@/Components/DeleteButton.jsx";
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Tab from '@mui/material/Tab';

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
        _method: "put"
    });

    // State for edit dialog, send dialog, and tab panel
    const [openEdit, setOpenEdit] = useState(false);
    const [openSend, setOpenSend] = useState(false);
    const [activeTab, setActiveTab] = useState('1');

    const handleSendToServer = () => {
        setOpenSend(false);
        router.post(route("admin.collectRequests.send", collectRequest.id), {}, { preserveScroll: true });
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
            onSuccess: handleClose
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
        } catch (e) {
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
            case 'pending':
                return 'warning';
            case 'scheduled':
                return 'info';
            case 'picked up':
                return 'secondary';
            case 'received':
                return 'success';
            case 'cancelled':
                return 'error';
            case 'completed':
                return 'success';
            default:
                return 'default';
        }
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            {/* Header: title, status, actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <Typography variant="h5" component="h1">
                        Collection Request #{collectRequest.id}
                    </Typography>
                    <Chip
                        label={collectRequest.status}
                        color={getStatusColor(collectRequest.status)}
                        sx={{ fontWeight: 'medium', textTransform: 'capitalize' }}
                    />
                    {/* Server sync badge */}
                    {collectRequest.server_id ? (
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
                    {!collectRequest.server_id && (
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
            {collectRequest.server_id ? (
                <Alert
                    icon={<CloudDone />}
                    severity="success"
                    sx={{ mb: 3, borderRadius: 2 }}
                >
                    This collection request has been synced to the main server with ID <strong>#{collectRequest.server_id}</strong>. Status updates will be received automatically via webhook.
                </Alert>
            ) : (
                <Alert
                    icon={<CloudOff />}
                    severity="warning"
                    sx={{ mb: 3, borderRadius: 2 }}
                    action={
                        <Button color="warning" size="small" startIcon={<Send />} onClick={() => setOpenSend(true)}>
                            Send Now
                        </Button>
                    }
                >
                    This collection request has not been sent to the main server yet. The lab will not receive it until it is synced.
                </Alert>
            )}

            {/* Main content tabs */}
            <TabContext value={activeTab}>
                <Paper
                    elevation={0}
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        mb: 4
                    }}
                >
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
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
                            <Tab
                                label="Orders"
                                value="3"
                                icon={<Receipt />}
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
                                    <Card variant="outlined" sx={{ borderColor: collectRequest.server_id ? 'success.light' : 'warning.light' }}>
                                        <CardHeader
                                            title="Server Synchronization"
                                            subheader={collectRequest.server_id
                                                ? "This request has been successfully sent to the main server."
                                                : "This request has not been sent to the main server yet."}
                                            avatar={
                                                <Avatar sx={{ bgcolor: collectRequest.server_id ? 'success.main' : 'warning.main' }}>
                                                    {collectRequest.server_id ? <CloudDone /> : <CloudOff />}
                                                </Avatar>
                                            }
                                            action={
                                                !collectRequest.server_id && (
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
                                                                <Avatar sx={{ bgcolor: 'success.light' }}><Tag /></Avatar>
                                                            </ListItemAvatar>
                                                            <ListItemText
                                                                primary="Server ID"
                                                                secondary={`#${collectRequest.server_id}`}
                                                                slotProps={{ secondary: { sx: { fontWeight: 600, color: 'success.dark', fontSize: '1rem' } } }}
                                                            />
                                                        </ListItem>
                                                    </List>
                                                </CardContent>
                                            </>
                                        )}
                                    </Card>
                                </Grid>
                                {/* Scheduling Information */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Card variant="outlined">
                                        <CardHeader
                                            title="Scheduled Collection"
                                            avatar={<Avatar sx={{ bgcolor: 'info.main' }}><Schedule /></Avatar>}
                                        />
                                        <Divider />
                                        <CardContent>
                                            <List disablePadding>
                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: 'info.light' }}>
                                                            <Event />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Date & Time"
                                                        secondary={formatDate(collectRequest?.details?.scheduleDate)}
                                                    />
                                                </ListItem>

                                                {collectRequest?.details?.scheduledDetails && (
                                                    <ListItem>
                                                        <ListItemAvatar>
                                                            <Avatar sx={{ bgcolor: 'info.light' }}>
                                                                <Notes />
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary="Additional Details"
                                                            secondary={collectRequest?.details?.scheduledDetails}
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
                                            avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}><LocalShipping /></Avatar>}
                                        />
                                        <Divider />
                                        <CardContent>
                                            <List disablePadding>
                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: 'secondary.light' }}>
                                                            <AssignmentReturn />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Date & Time"
                                                        secondary={formatDate(collectRequest?.details?.pickupDate)}
                                                    />
                                                </ListItem>

                                                {collectRequest?.details?.["picked upDetails"] && (
                                                    <ListItem>
                                                        <ListItemAvatar>
                                                            <Avatar sx={{ bgcolor: 'secondary.light' }}>
                                                                <Notes />
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary="Additional Details"
                                                            secondary={collectRequest?.details?.["picked upDetails"]}
                                                        />
                                                    </ListItem>
                                                )}
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
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
                                            avatar={<Avatar sx={{ bgcolor: 'warning.main' }}><Receipt /></Avatar>}
                                            subheader={`Customer: ${collectRequest.user.name}`}
                                        />
                                        <Divider />
                                        <CardContent>
                                            <List disablePadding>
                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: 'warning.light' }}>
                                                            <Person />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Name"
                                                        secondary={collectRequest?.user?.meta?.billing?.name || "Not specified"}
                                                    />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: 'warning.light' }}>
                                                            <Email />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Email"
                                                        secondary={collectRequest?.user?.meta?.billing?.email || "Not specified"}
                                                    />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: 'warning.light' }}>
                                                            <Phone />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Phone"
                                                        secondary={collectRequest?.user?.meta?.billing?.phone || "Not specified"}
                                                    />
                                                </ListItem>

                                                <Divider component="li" variant="inset" />

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: 'warning.light' }}>
                                                            <Streetview />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Street Address"
                                                        secondary={collectRequest?.user?.meta?.billing?.address || "Not specified"}
                                                    />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: 'warning.light' }}>
                                                            <LocationCity />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="City"
                                                        secondary={collectRequest?.user?.meta?.billing?.city || "Not specified"}
                                                    />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: 'warning.light' }}>
                                                            <LocationCity />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="State"
                                                        secondary={collectRequest?.user?.meta?.billing?.state || "Not specified"}
                                                    />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: 'warning.light' }}>
                                                            <Flag />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Country"
                                                        secondary={collectRequest?.user?.meta?.billing?.country || "Not specified"}
                                                    />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: 'warning.light' }}>
                                                            <LocationSearching />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Zip/Postal Code"
                                                        secondary={collectRequest?.user?.meta?.billing?.zip || "Not specified"}
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
                                            avatar={<Avatar sx={{ bgcolor: 'success.main' }}><Phone /></Avatar>}
                                            subheader="For collection communication"
                                        />
                                        <Divider />
                                        <CardContent>
                                            <List disablePadding>
                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: 'success.light' }}>
                                                            <Email />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Email"
                                                        secondary={collectRequest?.user?.meta?.contact?.email || "Not specified"}
                                                    />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: 'success.light' }}>
                                                            <Phone />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Phone"
                                                        secondary={collectRequest?.user?.meta?.contact?.phone || "Not specified"}
                                                    />
                                                </ListItem>

                                                <Divider component="li" variant="inset" />

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: 'success.light' }}>
                                                            <LocationCity />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="City"
                                                        secondary={collectRequest?.user?.meta?.contact?.city || "Not specified"}
                                                    />
                                                </ListItem>

                                                <ListItem>
                                                    <ListItemAvatar>
                                                        <Avatar sx={{ bgcolor: 'success.light' }}>
                                                            <Flag />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary="Country"
                                                        secondary={collectRequest?.user?.meta?.contact?.country || "Not specified"}
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
                                            <TableCell width="30%">Tests</TableCell>
                                            <TableCell width="15%">Status</TableCell>
                                            <TableCell width="25%">Patient</TableCell>
                                            <TableCell width="20%">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {collectRequest.orders.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                                    <Typography color="text.secondary">
                                                        No orders found for this collection request
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            collectRequest.orders.map(order => (
                                                <TableRow key={order.id}>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            #{order.id}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {order.tests.map(test => (
                                                            <Chip
                                                                key={test.id}
                                                                label={test.name}
                                                                size="small"
                                                                sx={{ mr: 0.5, mb: 0.5 }}
                                                            />
                                                        ))}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={order.status}
                                                            size="small"
                                                            color={getStatusColor(order.status)}
                                                            sx={{
                                                                fontWeight: 'medium',
                                                                textTransform: 'capitalize'
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.light' }}>
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
                                                                    href={route("order-summary", order.id)}
                                                                    target="_blank"
                                                                    size="small"
                                                                    color="primary"
                                                                >
                                                                    <Download fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>

                                                            <Tooltip title="View Order">
                                                                <IconButton
                                                                    href={route("orders.show", order.id)}
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
                                                                        href={route("orders.edit", {order: order.id, step: order.step})}
                                                                        color="warning"
                                                                        size="small"
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}

                                                            {order.deletable && (
                                                                <DeleteButton
                                                                    url={route("orders.destroy", order.id)}
                                                                    size="small"
                                                                    IconProps={{ fontSize: 'small' }}
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
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CloudSync color="success" />
                    Send to Main Server
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This will queue <strong>Collection Request #{collectRequest.id}</strong> to be sent to the main server. Once sent, the lab will be notified and the request will receive a server tracking ID. This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setOpenSend(false)} variant="outlined" size="small">
                        Cancel
                    </Button>
                    <Button onClick={handleSendToServer} variant="contained" color="success" size="small" startIcon={<Send />} autoFocus>
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
        title: "Collect Requests",
        link: "/admin/collectRequests",
        icon: <LocalShipping fontSize="small" />
    }
];

// Layout wrapper
Show.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={[
            ...breadCrumbs,
            {
                title: "Collection Request #" + page.props.collectRequest.id,
                link: null,
                icon: <Receipt fontSize="small" />
            }
        ]}
    />
);

export default Show;
