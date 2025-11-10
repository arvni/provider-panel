import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Chip,
    Alert,
    Paper
} from "@mui/material";
import { useSubmitForm } from "@/Services/api";
import EditLayout from "../EditLayout";

/**
 * PatientTestAssignment Component
 * Allows assigning which patient(s) each test is for
 */
const PatientTestAssignment = ({ auth, order, step, patients }) => {
    // Initialize assignments: each test assigned to main patient by default
    const [assignments, setAssignments] = useState(() => {
        // If order already has assignments, load them
        if (order.order_items && order.order_items.length > 0) {
            return order.order_items.map(item => {
                const assignedPatients = item.patients && item.patients.length > 0
                    ? item.patients.map(p => p.id)
                    : [order.main_patient_id];

                return {
                    test_id: item.test_id,
                    test_name: item.test?.name || 'Unknown Test',
                    patient_ids: assignedPatients
                };
            });
        }

        // Default: assign all tests to main patient
        return (order.tests || []).map(test => ({
            test_id: test.id,
            test_name: test.name,
            patient_ids: [order.main_patient_id]
        }));
    });

    const { submit, processing, errors } = useSubmitForm(
        { assignments, _method: "put" },
        route("orders.update", { order: order.id, step })
    );

    // Toggle patient for a test
    const handleTogglePatient = (testIndex, patientId) => {
        const updatedAssignments = [...assignments];
        const assignment = updatedAssignments[testIndex];

        if (assignment.patient_ids.includes(patientId)) {
            // Remove patient (must keep at least one)
            if (assignment.patient_ids.length > 1) {
                assignment.patient_ids = assignment.patient_ids.filter(id => id !== patientId);
            }
        } else {
            // Add patient
            assignment.patient_ids.push(patientId);
        }

        setAssignments(updatedAssignments);
    };

    const handleSubmit = () => {
        submit();
    };

    // Get patient details
    const getPatientById = (id) => {
        return patients.find(p => p.id === id);
    };

    const isMainPatient = (patientId) => {
        return patientId === order.main_patient_id;
    };

    return (
        <EditLayout
            step={step}
            auth={auth}
            id={order.id}
            onSubmit={handleSubmit}
            isSubmitting={processing}
        >
            <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                    Select which patient(s) each test is for. By default, all tests are assigned to the main patient.
                    You can assign multiple patients to a single test if needed.
                </Alert>

                {errors && Object.keys(errors).length > 0 && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        Please ensure each test has at least one patient assigned.
                    </Alert>
                )}

                {assignments.length === 0 ? (
                    <Alert severity="warning">
                        No tests found. Please go back and add tests first.
                    </Alert>
                ) : (
                    assignments.map((assignment, testIndex) => (
                        <Card key={assignment.test_id} sx={{ mb: 2 }} elevation={2}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom color="primary">
                                    {assignment.test_name}
                                </Typography>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Assigned to {assignment.patient_ids.length} patient(s)
                                </Typography>

                                <FormGroup>
                                    {patients && patients.length > 0 ? (
                                        patients.map((patient) => {
                                            const isChecked = assignment.patient_ids.includes(patient.id);
                                            const isMain = isMainPatient(patient.id);
                                            const isOnlyPatient = assignment.patient_ids.length === 1 && isChecked;

                                            return (
                                                <Paper
                                                    key={patient.id}
                                                    sx={{
                                                        p: 1,
                                                        mb: 1,
                                                        backgroundColor: isChecked ? 'action.selected' : 'background.paper',
                                                        border: isChecked ? 2 : 1,
                                                        borderColor: isChecked ? 'primary.main' : 'divider'
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={isChecked}
                                                                onChange={() => handleTogglePatient(testIndex, patient.id)}
                                                                disabled={isOnlyPatient}
                                                            />
                                                        }
                                                        label={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                                <Typography variant="body1">
                                                                    {patient.fullName || patient.full_name || 'Unknown Patient'}
                                                                </Typography>
                                                                {isMain && (
                                                                    <Chip
                                                                        label="Main Patient"
                                                                        size="small"
                                                                        color="primary"
                                                                        variant="outlined"
                                                                    />
                                                                )}
                                                                {patient.dateOfBirth && (
                                                                    <Chip
                                                                        label={`DOB: ${patient.dateOfBirth}`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                )}
                                                                {patient.gender && (
                                                                    <Chip
                                                                        label={patient.gender}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                </Paper>
                                            );
                                        })
                                    ) : (
                                        <Alert severity="warning">
                                            No patients found. Please go back and add patient details first.
                                        </Alert>
                                    )}
                                </FormGroup>
                            </CardContent>
                        </Card>
                    ))
                )}
            </Box>
        </EditLayout>
    );
};

export default PatientTestAssignment;
