import React from "react";
import {
    Alert,
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
 * Requested-tests review section on the Finalize page.
 */
const TestsSection = ({ data, errors, expanded, onToggle, status, hasError, orderId }) => {
    const theme = useTheme();

    return (
        <CollapsibleSection
            icon={<MedicalServices />}
            title="Requested Tests"
            expanded={expanded}
            onToggle={onToggle}
            hasError={hasError}
            headerBg={alpha(theme.palette.primary.main, 0.8)}
            headerColor={theme.palette.primary.contrastText}
            status={status}
        >
            {errors.tests && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
                    {errors.tests}
                </Alert>
            )}

            {data.tests && data.tests.length > 0 ? (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell width="5%">#</TableCell>
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
                                        <Typography fontWeight="500">{test.name}</Typography>
                                    </TableCell>
                                    <TableCell>{test.code || "N/A"}</TableCell>
                                    <TableCell>{test.turnaroundTime || "N/A"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Alert severity="warning">
                    No tests have been selected. Please select at least one test.
                </Alert>
            )}

            <EditSectionButton orderId={orderId} step="test method" label="Edit Tests" />
        </CollapsibleSection>
    );
};

export default TestsSection;
