import React from "react";
import {
    Box,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useTheme,
    alpha,
} from "@mui/material";
import { MedicalServices } from "@mui/icons-material";
import CollapsibleSection from "@/Pages/Order/Components/Finalize/CollapsibleSection";
import EditSectionButton from "@/Pages/Order/Components/Finalize/EditSectionButton";

/**
 * Patient-test assignment review section on the Finalize page.
 */
const PatientTestAssignmentSection = ({
    orderItems,
    mainPatientId,
    expanded,
    onToggle,
    orderId,
}) => {
    const theme = useTheme();

    return (
        <CollapsibleSection
            icon={<MedicalServices />}
            title="Patient-Test Assignments"
            expanded={expanded}
            onToggle={onToggle}
            headerBg={alpha(theme.palette.info.main, 0.8)}
            headerColor={theme.palette.info.contrastText}
        >
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Test Name</TableCell>
                            <TableCell>Assigned Patients</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orderItems.map((orderItem, index) => (
                            <TableRow key={orderItem.id || index}>
                                <TableCell>
                                    <Typography fontWeight={500}>
                                        {orderItem.test?.name ||
                                            orderItem.Test?.name ||
                                            "Unknown Test"}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                        {orderItem.patients && orderItem.patients.length > 0 ? (
                                            orderItem.patients.map((patient) => (
                                                <Chip
                                                    key={patient.id}
                                                    label={patient.fullName || patient.full_name}
                                                    size="small"
                                                    color={
                                                        patient.id === mainPatientId
                                                            ? "primary"
                                                            : "default"
                                                    }
                                                    variant={
                                                        patient.id === mainPatientId
                                                            ? "filled"
                                                            : "outlined"
                                                    }
                                                />
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No patients assigned
                                            </Typography>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <EditSectionButton
                orderId={orderId}
                step="patient test assignment"
                label="Edit Assignments"
            />
        </CollapsibleSection>
    );
};

export default PatientTestAssignmentSection;
