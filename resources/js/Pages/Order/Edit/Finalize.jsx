import React, { useState } from "react";
import { useSubmitForm } from "@/Services/api";
import EditLayout from "@/Pages/Order/EditLayout";
import {
    Alert,
    Box,
    Button,
    Chip,
    Collapse,
    Divider,
    Grid,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";
import {
    CheckCircle,
    ExpandMore,
    ExpandLess,
    Person,
    ScienceOutlined,
    Assignment,
    MedicalServices,
    EventNote,
    Send,
    Print,
    Download,
    Save
} from "@mui/icons-material";

/**
 * Finalize component for reviewing and submitting order
 *
 * @param {Object} props Component props
 * @param {Object} props.auth Authentication information
 * @param {Object} props.order Order data
 * @param {string|number} props.step Current step in the process
 * @returns {JSX.Element} Rendered component
 */
const Finalize = ({ auth, order, step }) => {
    // State for expanded sections
    const [expandedSections, setExpandedSections] = useState({
        tests: true,
        patient: true,
        samples: true,
        forms: true
    });

    // Setup form with existing data
    const {
        data,
        submit,
        processing,
        recentlySuccessful
    } = useSubmitForm(
        { ...order, _method: "put" },
        route("orders.update", { order: order.id, step })
    );

    /**
     * Handle form submission
     */
    const handleSubmit = () => {
        if (window.confirm("Are you sure you want to finalize this order? After submission, certain details cannot be modified.")) {
            submit();
        }
    };

    /**
     * Toggle section expansion
     *
     * @param {string} section Section identifier
     */
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    /**
     * Format date string for better display
     *
     * @param {string} dateString Date string to format
     * @returns {string} Formatted date
     */
    const formatDate = (dateString) => {
        if (!dateString) return "Not specified";

        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(date);
        } catch (e) {
            return dateString;
        }
    };

    /**
     * Create PDF download of order summary
     */
    const downloadSummary = () => {
        window.print();
        // In a real application, you would implement proper PDF generation
    };

    return (
        <EditLayout auth={auth} step={step} id={order.id}>
            <Paper
                elevation={0}
                variant="outlined"
                sx={{
                    p: 3,
                    mb: 2,
                    borderRadius: 2,
                    position: 'relative'
                }}
            >
                {/* Show loading indicator during form submission */}
                {processing && (
                    <LinearProgress
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8
                        }}
                    />
                )}

                {/* Header section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" component="h1" fontWeight="500">
                        Order Summary
                    </Typography>

                    <Chip
                        label={`Order ID: ${data.id}`}
                        color="primary"
                        variant="outlined"
                    />
                </Box>

                {/* Success message */}
                {recentlySuccessful && (
                    <Alert
                        severity="success"
                        sx={{ mb: 3 }}
                        icon={<CheckCircle />}
                    >
                        Your order has been successfully submitted. We'll begin processing it right away.
                    </Alert>
                )}

                {/* Order submission instructions */}
                <Paper
                    variant="outlined"
                    sx={{
                        p: 2,
                        mb: 4,
                        bgcolor: 'primary.lightest',
                        borderColor: 'primary.light',
                        borderRadius: 2
                    }}
                >
                    <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                        Ready to Finalize Your Order
                    </Typography>

                    <Typography variant="body2" paragraph>
                        Please review all information below carefully. To finalize your order, click the "Submit Order" button at the bottom of the page.
                    </Typography>

                    <Typography variant="body2">
                        After submission, you'll receive a confirmation email with your order details. If you need to make changes, please do so before submitting.
                    </Typography>
                </Paper>

                {/* Tests Section */}
                <Paper
                    variant="outlined"
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                        }}
                        onClick={() => toggleSection('tests')}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MedicalServices />
                            <Typography variant="subtitle1" fontWeight="500">
                                Requested Tests
                            </Typography>
                        </Box>

                        {expandedSections.tests ? <ExpandLess /> : <ExpandMore />}
                    </Box>

                    <Collapse in={expandedSections.tests}>
                        <Box sx={{ p: 2 }}>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width="10%">#</TableCell>
                                            <TableCell>Test Name</TableCell>
                                            <TableCell width="20%">Test Code</TableCell>
                                            <TableCell width="20%">Turnaround Time</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.tests.map((test, index) => (
                                            <TableRow key={`test-${index}`}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>
                                                    <Typography fontWeight="500">
                                                        {test.name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{test.code || 'N/A'}</TableCell>
                                                <TableCell>{test.turnaroundTime || 'N/A'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Collapse>
                </Paper>

                {/* Patient Details Section */}
                <Paper
                    variant="outlined"
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: 'info.main',
                            color: 'info.contrastText',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                        }}
                        onClick={() => toggleSection('patient')}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person />
                            <Typography variant="subtitle1" fontWeight="500">
                                Patient Details
                            </Typography>
                        </Box>

                        {expandedSections.patient ? <ExpandLess /> : <ExpandMore />}
                    </Box>

                    <Collapse in={expandedSections.patient}>
                        <Box sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <List dense>
                                        <ListItem>
                                            <ListItemIcon>
                                                <Person color="info" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Full Name"
                                                secondary={data.patient?.fullName || "Not specified"}
                                                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                                secondaryTypographyProps={{ variant: 'body1', fontWeight: '500' }}
                                            />
                                        </ListItem>

                                        <Divider component="li" variant="inset" />

                                        <ListItem>
                                            <ListItemIcon>
                                                <EventNote color="info" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Date of Birth"
                                                secondary={formatDate(data.patient?.dateOfBirth)}
                                                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                                secondaryTypographyProps={{ variant: 'body1' }}
                                            />
                                        </ListItem>

                                        <Divider component="li" variant="inset" />

                                        <ListItem>
                                            <ListItemIcon>
                                                <Assignment color="info" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Reference ID"
                                                secondary={data.patient?.reference_id || "Not specified"}
                                                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                                secondaryTypographyProps={{ variant: 'body1' }}
                                            />
                                        </ListItem>

                                        <Divider component="li" variant="inset" />

                                        <ListItem>
                                            <ListItemText
                                                primary="Gender"
                                                secondary={data.patient?.gender ? "Male" : "Female"}
                                                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                                secondaryTypographyProps={{ variant: 'body1' }}
                                            />
                                        </ListItem>

                                        <Divider component="li" variant="inset" />

                                        <ListItem>
                                            <ListItemText
                                                primary="Consanguineous Parents"
                                                secondary={data.patient?.consanguineousParents ? "Yes" : "No"}
                                                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                                secondaryTypographyProps={{ variant: 'body1' }}
                                            />
                                        </ListItem>
                                    </List>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Contact Information
                                    </Typography>

                                    <List dense>
                                        <ListItem>
                                            <ListItemText
                                                primary="Email"
                                                secondary={data?.patient?.contact?.email || "Not specified"}
                                                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                                secondaryTypographyProps={{ variant: 'body1' }}
                                            />
                                        </ListItem>

                                        <Divider component="li" />

                                        <ListItem>
                                            <ListItemText
                                                primary="Phone"
                                                secondary={data?.patient?.contact?.phone || "Not specified"}
                                                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                                secondaryTypographyProps={{ variant: 'body1' }}
                                            />
                                        </ListItem>

                                        <Divider component="li" />

                                        <ListItem>
                                            <ListItemText
                                                primary="Address"
                                                secondary={`${data?.patient?.contact?.address || ""}
                                   ${data?.patient?.contact?.city ? ", " + data?.patient?.contact?.city : ""}
                                   ${data?.patient?.contact?.state ? ", " + data?.patient?.contact?.state : ""}
                                   ${data?.patient?.contact?.country?.label ? ", " + data?.patient?.contact?.country?.label : ""}`}
                                                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                                secondaryTypographyProps={{ variant: 'body1' }}
                                            />
                                        </ListItem>
                                    </List>
                                </Grid>
                            </Grid>
                        </Box>
                    </Collapse>
                </Paper>

                {/* Sample Details Section */}
                <Paper
                    variant="outlined"
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: 'success.main',
                            color: 'success.contrastText',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                        }}
                        onClick={() => toggleSection('samples')}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ScienceOutlined />
                            <Typography variant="subtitle1" fontWeight="500">
                                Sample Materials
                            </Typography>
                        </Box>

                        {expandedSections.samples ? <ExpandLess /> : <ExpandMore />}
                    </Box>

                    <Collapse in={expandedSections.samples}>
                        <Box sx={{ p: 3 }}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>#</TableCell>
                                            <TableCell>Sample Type</TableCell>
                                            <TableCell>Sample ID</TableCell>
                                            <TableCell>Collection Date</TableCell>
                                            <TableCell>Expiration Date</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.samples?.map((sample, index) => (
                                            <TableRow key={`sample-${index}`}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{sample.sample_type?.name || "Not specified"}</TableCell>
                                                <TableCell>{sample.sampleId || "Not specified"}</TableCell>
                                                <TableCell>{formatDate(sample.collectionDate)}</TableCell>
                                                <TableCell>{sample?.material ? formatDate(sample.material.expireDate) : "Not specified"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Collapse>
                </Paper>

                {/* Request Form Section */}
                <Paper
                    variant="outlined"
                    sx={{
                        mb: 4,
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: 'warning.main',
                            color: 'warning.contrastText',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                        }}
                        onClick={() => toggleSection('forms')}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Assignment />
                            <Typography variant="subtitle1" fontWeight="500">
                                Request Form Details
                            </Typography>
                        </Box>

                        {expandedSections.forms ? <ExpandLess /> : <ExpandMore />}
                    </Box>

                    <Collapse in={expandedSections.forms}>
                        <Box sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                {data.orderForms.map((orderForm, formIndex) => (
                                    <Grid item xs={12} md={6} key={orderForm.id || formIndex}>
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                height: '100%',
                                                borderRadius: 1
                                            }}
                                        >
                                            <Typography
                                                variant="subtitle2"
                                                color="text.secondary"
                                                gutterBottom
                                            >
                                                Form {formIndex + 1}
                                            </Typography>

                                            <List dense>
                                                {orderForm.formData.map((item, itemIndex) => (
                                                    <React.Fragment key={`form-${formIndex}-item-${itemIndex}`}>
                                                        {itemIndex > 0 && <Divider component="li" />}
                                                        <ListItem>
                                                            <ListItemText
                                                                primary={item.label}
                                                                secondary={item.value || "Not specified"}
                                                                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                                                secondaryTypographyProps={{ variant: 'body1' }}
                                                            />
                                                        </ListItem>
                                                    </React.Fragment>
                                                ))}
                                            </List>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Collapse>
                </Paper>

                {/* Action buttons */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mt: 4,
                        pt: 3,
                        borderTop: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<Print />}
                            onClick={downloadSummary}
                            disabled={processing}
                        >
                            Print Summary
                        </Button>

                        <Button
                            variant="outlined"
                            startIcon={<Download />}
                            onClick={downloadSummary}
                            disabled={processing}
                        >
                            Download PDF
                        </Button>
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<Save />}
                            onClick={() => submit({ preserveScroll: true })}
                            disabled={processing}
                        >
                            Save Draft
                        </Button>

                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Send />}
                            onClick={handleSubmit}
                            disabled={processing}
                            sx={{ minWidth: 150 }}
                        >
                            {processing ? "Submitting..." : "Submit Order"}
                        </Button>
                    </Stack>
                </Box>
            </Paper>
        </EditLayout>
    );
};

export default Finalize;
