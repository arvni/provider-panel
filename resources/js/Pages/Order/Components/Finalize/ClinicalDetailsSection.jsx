import React from "react";
import {
    Alert,
    Box,
    Button,
    Divider,
    Grid,
    List,
    ListItem,
    ListItemText,
    Paper,
    Typography,
    useTheme,
    alpha,
} from "@mui/material";
import {
    Assignment,
    FileCopy as FileCopyIcon,
    Download as DownloadIcon,
} from "@mui/icons-material";
import CollapsibleSection from "@/Pages/Order/Components/Finalize/CollapsibleSection";
import EditSectionButton from "@/Pages/Order/Components/Finalize/EditSectionButton";

/**
 * Clinical-details review section on the Finalize page: the order-form
 * field/value pairs plus any uploaded clinical files.
 */
const ClinicalDetailsSection = ({
    data,
    errors,
    expanded,
    onToggle,
    status,
    hasError,
    orderId,
}) => {
    const theme = useTheme();

    return (
        <CollapsibleSection
            icon={<Assignment />}
            title="Clinical Details"
            expanded={expanded}
            onToggle={onToggle}
            hasError={hasError}
            headerBg={alpha(theme.palette.warning.main, 0.8)}
            headerColor={theme.palette.warning.contrastText}
            status={status}
        >
            {errors.orderForms && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
                    {errors.orderForms}
                </Alert>
            )}

            {data.orderForms && data.orderForms.length > 0 ? (
                <Grid container spacing={3}>
                    {data.orderForms.map((orderForm, formIndex) => (
                        <Grid size={{ xs: 12, md: 6 }} key={orderForm.id || formIndex}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    height: "100%",
                                    borderRadius: 1,
                                    bgcolor: errors[`orderForms[${formIndex}].hasErrors`]
                                        ? alpha(theme.palette.error.main, 0.05)
                                        : "transparent",
                                    borderColor: errors[`orderForms[${formIndex}].hasErrors`]
                                        ? theme.palette.error.main
                                        : theme.palette.divider,
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    color={
                                        errors[`orderForms[${formIndex}].hasErrors`]
                                            ? "error"
                                            : "text.secondary"
                                    }
                                    gutterBottom
                                    fontWeight={600}
                                >
                                    {orderForm.name || `Form ${formIndex + 1}`}
                                </Typography>

                                {errors[`orderForms[${formIndex}].hasErrors`] && (
                                    <Typography
                                        variant="caption"
                                        color="error"
                                        sx={{ display: "block", mb: 1 }}
                                    >
                                        {errors[`orderForms[${formIndex}].hasErrors`]}
                                    </Typography>
                                )}

                                <List dense>
                                    {orderForm.formData &&
                                        orderForm.formData.map((item, itemIndex) => (
                                            <React.Fragment
                                                key={`form-${formIndex}-item-${itemIndex}`}
                                            >
                                                {itemIndex > 0 && <Divider component="li" />}
                                                <ListItem>
                                                    <ListItemText
                                                        primary={item.label}
                                                        secondary={item.value || "Not specified"}
                                                        primaryTypographyProps={{
                                                            variant: "body2",
                                                            color: errors[
                                                                `orderForms[${formIndex}].formData[${itemIndex}].value`
                                                            ]
                                                                ? "error.main"
                                                                : "text.secondary",
                                                        }}
                                                        secondaryTypographyProps={{
                                                            variant: "body1",
                                                            color: errors[
                                                                `orderForms[${formIndex}].formData[${itemIndex}].value`
                                                            ]
                                                                ? "error.main"
                                                                : "text.primary",
                                                        }}
                                                    />
                                                </ListItem>
                                                {errors[
                                                    `orderForms[${formIndex}].formData[${itemIndex}].value`
                                                ] && (
                                                    <Typography
                                                        variant="caption"
                                                        color="error"
                                                        sx={{ ml: 2 }}
                                                    >
                                                        {
                                                            errors[
                                                                `orderForms[${formIndex}].formData[${itemIndex}].value`
                                                            ]
                                                        }
                                                    </Typography>
                                                )}
                                            </React.Fragment>
                                        ))}
                                </List>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Alert severity="warning">
                    Clinical information is missing. Please complete the Clinical Details section.
                </Alert>
            )}

            {/* Clinical Details Files Section */}
            {data.files && data.files.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
                    >
                        <FileCopyIcon fontSize="small" color="primary" />
                        Uploaded Files ({data.files.length})
                    </Typography>

                    <Grid container spacing={2}>
                        {data.files.map((file, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: 1,
                                        border: "1px solid",
                                        borderColor: alpha(theme.palette.primary.main, 0.2),
                                        backgroundColor: alpha(theme.palette.primary.main, 0.03),
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1.5,
                                        transition: "all 0.2s",
                                        "&:hover": {
                                            borderColor: theme.palette.primary.main,
                                            backgroundColor: alpha(
                                                theme.palette.primary.main,
                                                0.08
                                            ),
                                        },
                                    }}
                                >
                                    <FileCopyIcon color="primary" sx={{ fontSize: 28 }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            variant="body2"
                                            fontWeight={500}
                                            sx={{
                                                mb: 0.5,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            File {index + 1}
                                        </Typography>
                                        <Button
                                            href={"/files/" + file}
                                            target="_blank"
                                            variant="text"
                                            size="small"
                                            startIcon={<DownloadIcon />}
                                            sx={{
                                                textTransform: "none",
                                                fontSize: "0.75rem",
                                                p: 0,
                                                minWidth: 0,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    display: "block",
                                                    maxWidth: "180px",
                                                }}
                                            >
                                                {file.split("/").pop()}
                                            </span>
                                        </Button>
                                    </Box>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            <EditSectionButton
                orderId={orderId}
                step="clinical details"
                label="Edit Clinical Details"
            />
        </CollapsibleSection>
    );
};

export default ClinicalDetailsSection;
