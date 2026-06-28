import React from "react";
import {
    Alert,
    Divider,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
    useTheme,
    alpha,
} from "@mui/material";
import { Person, Assignment, MedicalServices, EventNote } from "@mui/icons-material";
import CollapsibleSection from "@/Pages/Order/Components/Finalize/CollapsibleSection";
import EditSectionButton from "@/Pages/Order/Components/Finalize/EditSectionButton";
import { formatLongDate } from "@/Pages/Order/Components/orderDisplay";

/**
 * Patient-details review section on the Finalize page.
 */
const PatientDetailsSection = ({ data, errors, expanded, onToggle, status, hasError, orderId }) => {
    const theme = useTheme();

    return (
        <CollapsibleSection
            icon={<Person />}
            title="Patient Details"
            expanded={expanded}
            onToggle={onToggle}
            hasError={hasError}
            headerBg={alpha(theme.palette.info.main, 0.8)}
            headerColor={theme.palette.info.contrastText}
            status={status}
        >
            {errors.patient && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
                    {errors.patient}
                </Alert>
            )}

            {data.patient ? (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <List dense>
                            <ListItem>
                                <ListItemIcon>
                                    <Person color="info" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Full Name"
                                    secondary={data.patient?.fullName || "Not specified"}
                                    primaryTypographyProps={{
                                        variant: "body2",
                                        color: "text.secondary",
                                    }}
                                    secondaryTypographyProps={{
                                        variant: "body1",
                                        fontWeight: "500",
                                        color: errors["patient.fullName"]
                                            ? "error.main"
                                            : "text.primary",
                                    }}
                                />
                            </ListItem>
                            {errors["patient.fullName"] && (
                                <Typography variant="caption" color="error" sx={{ pl: 9 }}>
                                    {errors["patient.fullName"]}
                                </Typography>
                            )}

                            <Divider component="li" variant="inset" />

                            <ListItem>
                                <ListItemIcon>
                                    <EventNote color="info" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Date of Birth"
                                    secondary={formatLongDate(data.patient?.dateOfBirth)}
                                    primaryTypographyProps={{
                                        variant: "body2",
                                        color: "text.secondary",
                                    }}
                                    secondaryTypographyProps={{
                                        variant: "body1",
                                        color: errors["patient.dateOfBirth"]
                                            ? "error.main"
                                            : "text.primary",
                                    }}
                                />
                            </ListItem>
                            {errors["patient.dateOfBirth"] && (
                                <Typography variant="caption" color="error" sx={{ pl: 9 }}>
                                    {errors["patient.dateOfBirth"]}
                                </Typography>
                            )}

                            <Divider component="li" variant="inset" />

                            <ListItem>
                                <ListItemIcon>
                                    <Assignment color="info" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Reference ID"
                                    secondary={data.patient?.reference_id || "Not specified"}
                                    primaryTypographyProps={{
                                        variant: "body2",
                                        color: "text.secondary",
                                    }}
                                    secondaryTypographyProps={{ variant: "body1" }}
                                />
                            </ListItem>

                            <Divider component="li" variant="inset" />

                            <ListItem>
                                <ListItemIcon>
                                    <Person color="info" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Gender"
                                    secondary={data.patient?.gender * 1 ? "Male" : "Female"}
                                    primaryTypographyProps={{
                                        variant: "body2",
                                        color: "text.secondary",
                                    }}
                                    secondaryTypographyProps={{
                                        variant: "body1",
                                        color: errors["patient.gender"]
                                            ? "error.main"
                                            : "text.primary",
                                    }}
                                />
                            </ListItem>
                            {errors["patient.gender"] && (
                                <Typography variant="caption" color="error" sx={{ pl: 9 }}>
                                    {errors["patient.gender"]}
                                </Typography>
                            )}

                            <Divider component="li" variant="inset" />

                            <ListItem>
                                <ListItemIcon>
                                    <MedicalServices color="info" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Consanguineous Parents"
                                    secondary={data.patient?.consanguineousParents ? "Yes" : "No"}
                                    primaryTypographyProps={{
                                        variant: "body2",
                                        color: "text.secondary",
                                    }}
                                    secondaryTypographyProps={{
                                        variant: "body1",
                                        color: errors["patient.consanguineousParents"]
                                            ? "error.main"
                                            : "text.primary",
                                    }}
                                />
                            </ListItem>
                            {errors["patient.consanguineousParents"] && (
                                <Typography variant="caption" color="error" sx={{ pl: 9 }}>
                                    {errors["patient.consanguineousParents"]}
                                </Typography>
                            )}
                        </List>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Contact Information
                        </Typography>

                        <List dense>
                            <ListItem>
                                <ListItemText
                                    primary="Email"
                                    secondary={data?.patient?.contact?.email || "Not specified"}
                                    primaryTypographyProps={{
                                        variant: "body2",
                                        color: "text.secondary",
                                    }}
                                    secondaryTypographyProps={{ variant: "body1" }}
                                />
                            </ListItem>

                            <Divider component="li" />

                            <ListItem>
                                <ListItemText
                                    primary="Phone"
                                    secondary={data?.patient?.contact?.phone || "Not specified"}
                                    primaryTypographyProps={{
                                        variant: "body2",
                                        color: "text.secondary",
                                    }}
                                    secondaryTypographyProps={{ variant: "body1" }}
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
                                    primaryTypographyProps={{
                                        variant: "body2",
                                        color: "text.secondary",
                                    }}
                                    secondaryTypographyProps={{ variant: "body1" }}
                                />
                            </ListItem>
                        </List>
                    </Grid>
                </Grid>
            ) : (
                <Alert severity="warning">
                    Patient information is missing. Please complete the Patient Details section.
                </Alert>
            )}

            <EditSectionButton
                orderId={orderId}
                step="patient details"
                label="Edit Patient Details"
            />
        </CollapsibleSection>
    );
};

export default PatientDetailsSection;
