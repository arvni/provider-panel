import React from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
    useTheme,
    alpha,
} from "@mui/material";
import {
    Assignment,
    CheckCircle,
    Error as ErrorIcon,
    Download,
} from "@mui/icons-material";
import CollapsibleSection from "@/Pages/Order/Components/Finalize/CollapsibleSection";
import EditSectionButton from "@/Pages/Order/Components/Finalize/EditSectionButton";

/**
 * Consent review section on the Finalize page: each consent item's agreed state
 * plus any uploaded consent form files.
 */
const ConsentSection = ({ restConsents, consentForm, errors, expanded, onToggle, status, hasError, orderId }) => {
    const theme = useTheme();

    return (
        <CollapsibleSection
            icon={<Assignment />}
            title="Consent Information"
            expanded={expanded}
            onToggle={onToggle}
            hasError={hasError}
            headerBg={alpha(theme.palette.primary.main, 0.7)}
            headerColor={theme.palette.primary.contrastText}
            status={status}
            mb={4}
        >
            {errors.consents && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
                    {errors.consents}
                </Alert>
            )}

            {/* Display processed consent data */}
            {restConsents && restConsents.length > 0 ? (
                <List>
                    {restConsents.map((consent, index) => (
                        <React.Fragment key={`consent-${index}`}>
                            {index > 0 && <Divider />}
                            <ListItem
                                sx={{
                                    py: 2,
                                    bgcolor: errors[`consents[${index}].value`]
                                        ? alpha(theme.palette.error.main, 0.05)
                                        : 'transparent'
                                }}
                            >
                                <ListItemIcon>
                                    {consent.value ? (
                                        <CheckCircle color="success" />
                                    ) : (
                                        <ErrorIcon color="error" />
                                    )}
                                </ListItemIcon>
                                <ListItemText
                                    primary={consent.title}
                                    secondary={consent.description}
                                    primaryTypographyProps={{
                                        variant: 'body1',
                                        fontWeight: 500,
                                        color: errors[`consents[${index}].value`] ? 'error.main' : 'text.primary'
                                    }}
                                    secondaryTypographyProps={{
                                        variant: 'body2',
                                        color: errors[`consents[${index}].value`] ? 'error.main' : 'text.secondary'
                                    }}
                                />

                                <Chip
                                    label={consent.value ? "Agreed" : "Not Agreed"}
                                    color={consent.value ? "success" : "error"}
                                    size="small"
                                    sx={{ fontWeight: 500 }}
                                />
                            </ListItem>
                            {errors[`consents[${index}].value`] && (
                                <Typography variant="caption" color="error"
                                            sx={{ ml: 9, display: 'block', mt: -1, mb: 1 }}>
                                    {errors[`consents[${index}].value`]}
                                </Typography>
                            )}
                        </React.Fragment>
                    ))}
                </List>
            ) : (
                <Alert severity="warning">
                    Consent information is missing. Please complete the Consent Form section.
                </Alert>
            )}

            {/* Display consent form files if available */}
            {consentForm && consentForm.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Consent Form Files
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {consentForm.map((file, index) => (
                            <Button
                                key={index}
                                href={`/files/${file}`}
                                target="_blank"
                                variant="outlined"
                                size="small"
                                startIcon={<Download />}
                                sx={{
                                    borderRadius: 1,
                                    textTransform: 'none'
                                }}
                            >
                                Form {index + 1}
                            </Button>
                        ))}
                    </Box>
                </Box>
            )}

            <EditSectionButton orderId={orderId} step="consent form" label="Edit Consent Form" />
        </CollapsibleSection>
    );
};

export default ConsentSection;
