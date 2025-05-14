import React, { useState } from "react";
import { useSubmitForm } from "@/Services/api";
import EditLayout from "@/Pages/Order/EditLayout";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Checkbox,
    Chip,
    Collapse,
    Divider,
    FormControlLabel,
    Grid,
    LinearProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
    Tooltip,
    Typography
} from "@mui/material";
import {
    Check,
    CheckCircle,
    ExpandMore,
    ExpandLess,
    InfoOutlined,
    NavigateNext,
    Save
} from "@mui/icons-material";
import FileUploader from "@/Components/FileUploader.jsx";

/**
 * ConsentForm component for managing consent information
 *
 * @param {Object} props Component props
 * @param {Object} props.auth Authentication information
 * @param {Object} props.order Order data containing consent information
 * @param {string|number} props.step Current step in the process
 * @param {Array} props.consents Available consent options
 * @returns {JSX.Element} Rendered component
 */
const ConsentForm = ({
                         auth,
                         order: {
                             consents: { consentForm, ...restConsents },
                             ...restOrder
                         },
                         step,
                         consents
                     }) => {
    // State for expanded sections
    const [expandedInfo, setExpandedInfo] = useState(true);

    // Setup form with existing data or defaults
    const {
        data,
        setData,
        submit,
        processing,
        recentlySuccessful,
    } = useSubmitForm({
        ...restOrder,
        consents: [...(!Object.keys(restConsents).length ? (consents) : []), ...(Object.values(restConsents))],
        _method: "put",
        consentForm
    }, route("orders.update", { order: restOrder.id, step }));

    /**
     * Update form data for a specific field
     *
     * @param {string} key Field name
     * @param {any} value Field value
     */
    const handleChange = (key, value) => {
        setData(previousData => ({ ...previousData, [key]: value }));
    };

    /**
     * Handle form submission
     *
     * @param {Event} e Form event
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Validate that all consent checkboxes are checked
        const allConsentsChecked = data.consents.every(consent => consent.value === true);

        if (!allConsentsChecked) {
            // Show error message if not all consents are checked
            setData('validationError', 'All consent items must be checked to proceed');
            return;
        }

        // Clear any previous validation errors
        setData('validationError', null);

        // Submit the form
        submit();
    };

    /**
     * Handle file uploads
     *
     * @param {string} name Field name
     * @param {Array} files File array
     */
    const handleFileChange = (name, files) => {
        setData(name, files);
    };

    /**
     * Update a specific consent value
     *
     * @param {number} index Consent index
     * @returns {Function} Change handler
     */
    const handleConsentChange = (index) => (e, value) => {
        const consents = [...data.consents];
        consents[index] = {
            ...consents[index],
            value: value
        };
        handleChange("consents", consents);
    };

    /**
     * Check if all consents are agreed to
     *
     * @returns {boolean} True if all consents are checked
     */
    const allConsentsChecked = () => {
        return data.consents.every(consent => consent.value === true);
    };

    /**
     * Toggle the info section expansion
     */
    const toggleInfo = () => {
        setExpandedInfo(!expandedInfo);
    };

    // Count how many consents are checked
    const checkedConsentsCount = data.consents.filter(consent => consent.value).length;
    const totalConsentsCount = data.consents.length;
    const consentProgress = totalConsentsCount > 0 ? (checkedConsentsCount / totalConsentsCount) * 100 : 0;

    return (
        <EditLayout auth={auth} step={step} id={restOrder.id}>
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

                <Box component="form" onSubmit={handleSubmit}>
                    {/* Header section */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" component="h1" fontWeight="500">
                            Consent Form
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontStyle: 'italic' }}
                        >
                            Order ID: {restOrder.id}
                        </Typography>
                    </Box>

                    {/* Info section */}
                    <Paper
                        variant="outlined"
                        sx={{
                            mb: 3,
                            overflow: 'hidden',
                            borderColor: 'primary.light',
                            bgcolor: 'primary.lightest',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <Box
                            sx={{
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText',
                                cursor: 'pointer'
                            }}
                            onClick={toggleInfo}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <InfoOutlined />
                                <Typography variant="subtitle1" fontWeight="500">
                                    Important Information
                                </Typography>
                            </Box>

                            {expandedInfo ? <ExpandLess /> : <ExpandMore />}
                        </Box>

                        <Collapse in={expandedInfo}>
                            <Box sx={{ p: 3 }}>
                                <Typography variant="body1" paragraph>
                                    Please read each consent item carefully before checking the box. By checking a box, you indicate that you understand and agree to the stated terms.
                                </Typography>

                                <Typography variant="body1" paragraph>
                                    All items must be agreed to before proceeding to the next step. If you have any questions about any consent item, please contact our support team.
                                </Typography>
                            </Box>
                        </Collapse>
                    </Paper>

                    {/* Success message */}
                    {recentlySuccessful && (
                        <Alert
                            severity="success"
                            sx={{ mb: 3 }}
                            icon={<CheckCircle />}
                        >
                            Your consent information has been successfully saved.
                        </Alert>
                    )}

                    {/* Validation error */}
                    {data.validationError && (
                        <Alert
                            severity="error"
                            sx={{ mb: 3 }}
                        >
                            {data.validationError}
                        </Alert>
                    )}

                    {/* Progress indicator */}
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            mb: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2">
                                Consent progress:
                            </Typography>
                            <Chip
                                label={`${checkedConsentsCount} of ${totalConsentsCount} consents`}
                                color={allConsentsChecked() ? "success" : "primary"}
                                size="small"
                                icon={allConsentsChecked() ? <Check /> : undefined}
                            />
                        </Box>

                        <Box sx={{ width: '50%' }}>
                            <LinearProgress
                                variant="determinate"
                                value={consentProgress}
                                color={allConsentsChecked() ? "success" : "primary"}
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                        </Box>
                    </Paper>

                    <Grid container spacing={3}>
                        {/* Consent checkboxes */}
                        <Grid item xs={12}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    borderRadius: 2,
                                    overflow: 'hidden'
                                }}
                            >
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'grey.100',
                                        borderBottom: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
                                    <Typography variant="subtitle1" fontWeight="500">
                                        Consent Items
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Please read and check all items below
                                    </Typography>
                                </Box>

                                <List sx={{ p: 0 }}>
                                    {data.consents.map((consent, index) => (
                                        <React.Fragment key={`consent-${index}`}>
                                            {index > 0 && <Divider component="li" />}
                                            <ListItem
                                                sx={{
                                                    py: 2,
                                                    '&:hover': {
                                                        bgcolor: 'action.hover'
                                                    },
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: consent.value ? 'success.main' : 'grey.400',
                                                            transition: 'background-color 0.3s ease'
                                                        }}
                                                    >
                                                        {consent.value ? <Check /> : index + 1}
                                                    </Avatar>
                                                </ListItemAvatar>

                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body1" fontWeight={consent.value ? 400 : 500}>
                                                            {consent.title}
                                                        </Typography>
                                                    }
                                                    secondary={consent.description}
                                                />

                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={consent.value || false}
                                                            onChange={handleConsentChange(index)}
                                                            disabled={processing}
                                                            color="primary"
                                                            required
                                                        />
                                                    }
                                                    label="I agree"
                                                    sx={{ ml: 2 }}
                                                />
                                            </ListItem>
                                        </React.Fragment>
                                    ))}
                                </List>
                            </Paper>
                        </Grid>

                        {/* File uploader */}
                        <Grid item xs={12}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    borderRadius: 2
                                }}
                            >
                                <Typography variant="subtitle1" fontWeight="500" sx={{ mb: 2 }}>
                                    Upload Signed Consent Form
                                </Typography>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    If you have a physically signed consent form, please upload it here. Acceptable formats include PDF, JPG, and PNG.
                                </Typography>

                                <FileUploader
                                    title="Drag consent form here or click to upload"
                                    onChange={handleFileChange}
                                    defaultValues={[...(data?.consentForm ?? [])]}
                                    name="consentForm"
                                    description="Upload your signed consent form (optional)"
                                    maxFiles={3}
                                />
                            </Paper>
                        </Grid>

                        {/* Submit buttons */}
                        <Grid item xs={12}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    mt: 2,
                                    pt: 3,
                                    borderTop: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    startIcon={<Save />}
                                    onClick={() => submit({ onSuccess: () => {}})}
                                    disabled={processing}
                                >
                                    Save as Draft
                                </Button>

                                <Tooltip
                                    title={allConsentsChecked() ? "" : "You must agree to all consent items to continue"}
                                    arrow
                                >
                  <span>
                    <Button
                        variant="contained"
                        type="submit"
                        endIcon={<NavigateNext />}
                        disabled={processing || !allConsentsChecked()}
                        color="primary"
                    >
                      {processing ? "Saving..." : "Save & Continue"}
                    </Button>
                  </span>
                                </Tooltip>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </EditLayout>
    );
};

export default ConsentForm;
