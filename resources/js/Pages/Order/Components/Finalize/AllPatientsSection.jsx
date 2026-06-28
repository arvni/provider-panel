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
import { Person } from "@mui/icons-material";
import CollapsibleSection from "@/Pages/Order/Components/Finalize/CollapsibleSection";
import EditSectionButton from "@/Pages/Order/Components/Finalize/EditSectionButton";
import { formatLongDate } from "@/Pages/Order/Components/orderDisplay";

/**
 * All-patients review section on the Finalize page (only shown for multi-patient
 * orders).
 */
const AllPatientsSection = ({ patients, mainPatientId, expanded, onToggle, orderId }) => {
    const theme = useTheme();

    return (
        <CollapsibleSection
            icon={<Person />}
            title={`All Patients (${patients.length})`}
            expanded={expanded}
            onToggle={onToggle}
            headerBg={alpha(theme.palette.secondary.main, 0.8)}
            headerColor={theme.palette.secondary.contrastText}
            chip={
                <Chip
                    label="Multiple Patients"
                    color="info"
                    size="small"
                    sx={{ ml: 1, fontWeight: 500 }}
                />
            }
        >
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Full Name</TableCell>
                            <TableCell>Date of Birth</TableCell>
                            <TableCell>Gender</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {patients.map((patient, index) => (
                            <TableRow key={patient.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Typography
                                            fontWeight={patient.id === mainPatientId ? 600 : 400}
                                        >
                                            {patient.fullName || patient.full_name}
                                        </Typography>
                                        {patient.id === mainPatientId && (
                                            <Chip
                                                label="Main Patient"
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell>{formatLongDate(patient.dateOfBirth)}</TableCell>
                                <TableCell>{patient.gender * 1 ? "Male" : "Female"}</TableCell>
                                <TableCell>
                                    <Chip
                                        label="Active"
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <EditSectionButton orderId={orderId} step="patient details" label="Edit Patients" />
        </CollapsibleSection>
    );
};

export default AllPatientsSection;
