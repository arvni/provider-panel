import React from "react";
import {
    Avatar,
    Button,
    Card,
    CardContent,
    CardHeader,
    Grid,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
    Stack,
    Typography,
    Box,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Tooltip,
    IconButton,
    useTheme,
    alpha,
    useMediaQuery
} from "@mui/material";
import ClientLayout from "@/Layouts/AuthenticatedLayout";
import {
    Close,
    Done,
    Download as DownloadIcon,
    FileCopy as FileCopyIcon,
    Print as PrintIcon,
    Person as PersonIcon,
    Science as ScienceIcon,
    Assignment as AssignmentIcon,
    FactCheck as FactCheckIcon,
    ContentCopy as ContentCopyIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    CalendarToday as CalendarIcon
} from "@mui/icons-material";
import ConsanguineousParents from "@/Enums/ConsanguineousParents.js";
import { motion } from "framer-motion";

/**
 * Enhanced Order Show component with improved layout and design
 */
const Show = ({ order: { consents, ...restOrder } }) => {
    const theme = useTheme();

    // Process consents data
    let consentForm, restConsents;
    if (Array.isArray(consents)) {
        restConsents = consents;
        consentForm = null;
    } else {
        consentForm = consents.consentForm;
        restConsents = Object.keys(consents)
            .filter(item => item !== "consentForm")
            .map(item => consents?.[item]);
    }

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.1,
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.4 }
        }
    };

    // Handle print functionality
    const handlePrint = () => {
        window.print();
    };

    // Copy order ID to clipboard
    const copyOrderId = () => {
        navigator.clipboard.writeText(restOrder.id.toString());
    };

    // Format date string
    const formatDate = (dateString) => {
        if (!dateString) return "Not specified";

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <Box
            component={motion.div}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            sx={{
                width: "100%",
                '@media print': {
                    margin: 0,
                    padding: 0
                }
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 3 },
                    mt: 2,
                    mb: 4,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    overflow: 'hidden',
                    '@media print': {
                        boxShadow: 'none',
                        border: 'none'
                    }
                }}
            >
                {/* Header Section */}
                <Box
                    component={motion.div}
                    variants={itemVariants}
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: 2,
                        mb: 3,
                        pb: 2,
                        borderBottom: '1px solid',
                        borderColor: theme.palette.divider,
                        '@media print': {
                            display: 'block'
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                '@media print': {
                                    display: 'none'
                                }
                            }}
                        >
                            <AssignmentIcon />
                        </Box>
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography
                                    component="h1"
                                    variant="h5"
                                    fontWeight={700}
                                    sx={{
                                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                        '@media print': {
                                            fontSize: '18px'
                                        }
                                    }}
                                >
                                    Order #{restOrder.id}
                                </Typography>
                                <Tooltip title="Copy Order ID">
                                    <IconButton
                                        size="small"
                                        onClick={copyOrderId}
                                        sx={{
                                            '@media print': {
                                                display: 'none'
                                            }
                                        }}
                                    >
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    '@media print': {
                                        display: 'none'
                                    }
                                }}
                            >
                                Created on {formatDate(restOrder.created_at || restOrder.createdAt)}
                            </Typography>
                        </Box>
                    </Box>

                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            '@media print': {
                                display: 'none'
                            }
                        }}
                    >
                        <Tooltip title="Print Order">
                            <IconButton
                                onClick={handlePrint}
                                sx={{
                                    border: '1px solid',
                                    borderColor: theme.palette.divider,
                                    borderRadius: 1
                                }}
                            >
                                <PrintIcon />
                            </IconButton>
                        </Tooltip>

                        <Button
                            href={route("order-summary", restOrder.id)}
                            target="_blank"
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            sx={{
                                borderRadius: 1,
                                textTransform: 'none',
                                boxShadow: 'none',
                                '&:hover': {
                                    boxShadow: theme.shadows[2]
                                }
                            }}
                        >
                            Download Summary
                        </Button>
                    </Stack>
                </Box>

                {/* Tests Section */}
                <Box
                    component={motion.div}
                    variants={itemVariants}
                    sx={{ mb: 4 }}
                >
                    <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        <ScienceIcon color="primary" />
                        Analysis Requested
                    </Typography>

                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            ml: 4
                        }}
                    >
                        {restOrder.tests.map((test, index) => (
                            <Chip
                                key={index}
                                label={test.name}
                                color="primary"
                                variant="outlined"
                                sx={{
                                    fontWeight: 500,
                                    borderRadius: 1,
                                    height: 32
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                {/* Patient Details Card */}
                <Card
                    component={motion.div}
                    variants={itemVariants}
                    elevation={0}
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        overflow: 'hidden'
                    }}
                >
                    <CardHeader
                        title={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon />
                                <Typography variant="h6" fontWeight={600}>
                                    Patient Details
                                </Typography>
                            </Box>
                        }
                        sx={{
                            py: 2,
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            borderBottom: '1px solid',
                            borderColor: theme.palette.divider
                        }}
                    />

                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TableContainer>
                                    <Table size="small">
                                        <TableBody>
                                            <TableRow>
                                                <TableCell
                                                    component="th"
                                                    sx={{
                                                        width: '40%',
                                                        fontWeight: 600,
                                                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                        verticalAlign: 'top'
                                                    }}
                                                >
                                                    Full Name
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {restOrder.patient?.fullName}
                                                </TableCell>
                                            </TableRow>

                                            <TableRow>
                                                <TableCell
                                                    component="th"
                                                    sx={{
                                                        fontWeight: 600,
                                                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                        verticalAlign: 'top'
                                                    }}
                                                >
                                                    Date of Birth
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <CalendarIcon fontSize="small" color="action" />
                                                        {formatDate(restOrder.patient?.dateOfBirth)}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>

                                            <TableRow>
                                                <TableCell
                                                    component="th"
                                                    sx={{
                                                        fontWeight: 600,
                                                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                        verticalAlign: 'top'
                                                    }}
                                                >
                                                    Reference ID
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                                                    }}
                                                >
                                                    {restOrder.patient?.reference_id || "Not specified"}
                                                </TableCell>
                                            </TableRow>

                                            <TableRow>
                                                <TableCell
                                                    component="th"
                                                    sx={{
                                                        fontWeight: 600,
                                                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                        verticalAlign: 'top'
                                                    }}
                                                >
                                                    Gender
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                                                    }}
                                                >
                                                    {(restOrder.patient?.gender * 1) ? "Male" : "Female"}
                                                </TableCell>
                                            </TableRow>

                                            <TableRow>
                                                <TableCell
                                                    component="th"
                                                    sx={{
                                                        fontWeight: 600,
                                                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                        verticalAlign: 'top'
                                                    }}
                                                >
                                                    Nationality
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                                                    }}
                                                >
                                                    {restOrder.patient?.nationality?.label || "Not specified"}
                                                </TableCell>
                                            </TableRow>

                                            <TableRow>
                                                <TableCell
                                                    component="th"
                                                    sx={{
                                                        fontWeight: 600,
                                                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                        verticalAlign: 'top'
                                                    }}
                                                >
                                                    Consanguineous Parents
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                                                    }}
                                                >
                                                    {ConsanguineousParents.get(restOrder.patient?.consanguineousParents)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography
                                    variant="subtitle1"
                                    fontWeight={600}
                                    sx={{
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}
                                >
                                    <LocationIcon fontSize="small" color="primary" />
                                    Contact Information
                                </Typography>

                                <Box sx={{ ml: 3, mb: 3 }}>
                                    {restOrder.patient?.contact?.email && (
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                            <EmailIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                                            <Typography variant="body2">
                                                {restOrder.patient?.contact?.email}
                                            </Typography>
                                        </Box>
                                    )}

                                    {restOrder.patient?.contact?.phone && (
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                            <PhoneIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                                            <Typography variant="body2">
                                                {restOrder.patient?.contact?.phone}
                                            </Typography>
                                        </Box>
                                    )}

                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                        <LocationIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                                        <Typography variant="body2">
                                            {[
                                                restOrder.patient?.contact?.address,
                                                restOrder.patient?.contact?.city,
                                                restOrder.patient?.contact?.state,
                                                restOrder.patient?.contact?.country?.label
                                            ].filter(Boolean).join(", ") || "Address not specified"}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Typography
                                    variant="subtitle1"
                                    fontWeight={600}
                                    sx={{
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}
                                >
                                    <ScienceIcon fontSize="small" color="primary" />
                                    Material Details
                                </Typography>

                                {restOrder.samples?.map((sample, index) => (
                                    <Box
                                        key={sample.id}
                                        sx={{
                                            mb: 2,
                                            ml: 3,
                                            p: 2,
                                            borderRadius: 1,
                                            border: '1px solid',
                                            borderColor: alpha(theme.palette.primary.main, 0.2),
                                            backgroundColor: alpha(theme.palette.primary.main, 0.03)
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight={600}
                                            sx={{ mb: 1 }}
                                        >
                                            Sample #{index + 1}
                                        </Typography>

                                        <Grid container spacing={1}>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Sample Type:
                                                </Typography>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {sample.sample_type?.name || "Not specified"}
                                                </Typography>
                                            </Grid>

                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Sample ID:
                                                </Typography>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {sample.sampleId || "Not specified"}
                                                </Typography>
                                            </Grid>

                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Collection Date:
                                                </Typography>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {formatDate(sample.collectionDate)}
                                                </Typography>
                                            </Grid>

                                            {sample?.material && (
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Expire Date:
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {formatDate(sample.material?.expire_date)}
                                                    </Typography>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Box>
                                ))}
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Request Form Card */}
                {restOrder?.orderForms?.length > 0 && (
                    <Card
                        component={motion.div}
                        variants={itemVariants}
                        elevation={0}
                        sx={{
                            mb: 3,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: theme.palette.divider,
                            overflow: 'hidden'
                        }}
                    >
                        <CardHeader
                            title={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AssignmentIcon />
                                    <Typography variant="h6" fontWeight={600}>
                                        Request Form
                                    </Typography>
                                </Box>
                            }
                            sx={{
                                py: 2,
                                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                borderBottom: '1px solid',
                                borderColor: theme.palette.divider
                            }}
                        />

                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Grid container spacing={3}>
                                {restOrder?.orderForms?.map(orderForm => (
                                    <Grid item xs={12} md={6} key={orderForm.id}>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableBody>
                                                    {orderForm?.formData.map((item, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell
                                                                component="th"
                                                                sx={{
                                                                    width: '40%',
                                                                    fontWeight: 600,
                                                                    borderBottom: index === orderForm.formData.length - 1 ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                                    verticalAlign: 'top'
                                                                }}
                                                            >
                                                                {item.label}
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    borderBottom: index === orderForm.formData.length - 1 ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.5)}`
                                                                }}
                                                            >
                                                                {item.value || "Not specified"}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {/* Consent Card */}
                <Card
                    component={motion.div}
                    variants={itemVariants}
                    elevation={0}
                    sx={{
                        mb: 0,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        overflow: 'hidden'
                    }}
                >
                    <CardHeader
                        title={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FactCheckIcon />
                                <Typography variant="h6" fontWeight={600}>
                                    Consent
                                </Typography>
                            </Box>
                        }
                        sx={{
                            py: 2,
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            borderBottom: '1px solid',
                            borderColor: theme.palette.divider
                        }}
                    />

                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <List sx={{ p: 0 }}>
                                    {restConsents?.map((consent, index) => (
                                        <ListItem
                                            key={index}
                                            disablePadding
                                            sx={{
                                                py: 1,
                                                px: 0,
                                                borderBottom: index === restConsents.length - 1 && !consentForm?.length ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.3)}`
                                            }}
                                        >
                                            <ListItemAvatar sx={{ minWidth: 45 }}>
                                                <Avatar
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        bgcolor: consent?.value ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                                                        color: consent?.value ? theme.palette.success.main : theme.palette.error.main
                                                    }}
                                                >
                                                    {consent?.value ? <Done /> : <Close />}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {consent?.title}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    ))}

                                    {consentForm?.length > 0 && (
                                        <ListItem
                                            disablePadding
                                            sx={{ py: 2 }}
                                        >
                                            <ListItemAvatar sx={{ minWidth: 45 }}>
                                                <Avatar
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                        color: theme.palette.primary.main
                                                    }}
                                                >
                                                    <FileCopyIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" fontWeight={600}>
                                                        Consent Form
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Box sx={{ mt: 1 }}>
                                                        {consentForm?.map((item, index) => (
                                                            <Button
                                                                key={index}
                                                                href={"/files/" + item}
                                                                target="_blank"
                                                                variant="outlined"
                                                                size="small"
                                                                startIcon={<DownloadIcon />}
                                                                sx={{
                                                                    mr: 1,
                                                                    mb: 1,
                                                                    borderRadius: 1,
                                                                    textTransform: 'none'
                                                                }}
                                                            >
                                                                Download Form {index + 1}
                                                            </Button>
                                                        ))}
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    )}
                                </List>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Paper>
        </Box>
    );
};

// Define breadcrumbs for layout
const breadcrumbs = [
    {
        title: "Orders",
        link: route("orders.index"),
        icon: null
    },
];

// Set layout for the page
Show.layout = (page) => (
    <ClientLayout
        auth={page.props.auth}
        breadcrumbs={[
            ...breadcrumbs,
            {
                title: "Order #" + page.props.order.id,
                link: "",
                icon: null
            },
        ]}
        children={page}
    />
);

export default Show;
