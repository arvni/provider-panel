import React from "react";
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography,
    useTheme,
    alpha,
} from "@mui/material";
import { Assignment as AssignmentIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import { itemVariants } from "@/Pages/Order/Components/orderMotion";

/**
 * Patient-test assignment matrix card on the Order Show page.
 */
const PatientTestAssignmentCard = ({ orderItems, mainPatientId }) => {
    const theme = useTheme();

    return (
        <Card
            component={motion.div}
            variants={itemVariants}
            elevation={0}
            sx={{
                mb: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: theme.palette.divider,
                overflow: 'hidden',
                '@media print': {
                    border: '1px solid #000 !important',
                    borderRadius: '0 !important',
                    marginBottom: '3mm !important',
                    backgroundColor: '#fff !important',
                    boxShadow: 'none !important',
                    pageBreakInside: 'avoid'
                }
            }}
        >
            <CardHeader
                title={
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        '@media print': {
                            gap: '1mm'
                        }
                    }}>
                        <AssignmentIcon sx={{
                            '@media print': {
                                display: 'none !important'
                            }
                        }} />
                        <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{
                                '@media print': {
                                    fontSize: '10px !important',
                                    fontWeight: 'bold !important',
                                    color: '#000 !important'
                                }
                            }}
                        >
                            Patient-Test Assignments
                        </Typography>
                    </Box>
                }
                sx={{
                    backgroundColor: alpha(theme.palette.info.main, 0.05),
                    borderBottom: '1px solid',
                    borderColor: theme.palette.divider,
                    '@media print': {
                        padding: '2mm !important',
                        backgroundColor: '#f5f5f5 !important',
                        borderBottom: '1px solid #000 !important'
                    }
                }}
            />
            <CardContent sx={{
                '@media print': {
                    padding: '2mm !important'
                }
            }}>
                <TableContainer>
                    <Table size="small">
                        <TableBody>
                            {orderItems.map((orderItem, index) => (
                                <TableRow key={orderItem.id || index} sx={{
                                    '@media print': {
                                        '& td': {
                                            fontSize: '7px !important',
                                            padding: '1mm !important',
                                            border: '1px solid #ddd !important'
                                        }
                                    }
                                }}>
                                    <TableCell sx={{ fontWeight: 600, width: '40%' }}>
                                        {orderItem.test?.name || orderItem.Test?.name || "Unknown Test"}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {orderItem.patients && orderItem.patients.length > 0 ? (
                                                orderItem.patients.map((patient) => (
                                                    <Chip
                                                        key={patient.id}
                                                        label={patient.fullName || patient.full_name}
                                                        size="small"
                                                        color={patient.id === mainPatientId ? "primary" : "default"}
                                                        variant={patient.id === mainPatientId ? "filled" : "outlined"}
                                                        sx={{
                                                            fontSize: '0.7rem',
                                                            height: 24,
                                                            '@media print': {
                                                                fontSize: '5px !important',
                                                                height: 'auto !important',
                                                                padding: '0.5mm !important',
                                                                margin: '0.25mm !important'
                                                            }
                                                        }}
                                                    />
                                                ))
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{
                                                    '@media print': {
                                                        fontSize: '7px !important'
                                                    }
                                                }}>
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
            </CardContent>
        </Card>
    );
};

export default PatientTestAssignmentCard;
