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
import { Person as PersonIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import { itemVariants } from "@/Pages/Order/Components/orderMotion";
import { formatShortDate } from "@/Pages/Order/Components/orderDisplay";

/**
 * "All Patients" card shown on the Order Show page when an order has more than
 * one patient.
 */
const AllPatientsCard = ({ patients, mainPatientId }) => {
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
                        <PersonIcon sx={{
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
                            All Patients ({patients.length})
                        </Typography>
                        <Chip
                            label="Multiple Patients"
                            color="info"
                            size="small"
                            sx={{
                                ml: 1,
                                fontWeight: 500,
                                '@media print': {
                                    display: 'none !important'
                                }
                            }}
                        />
                    </Box>
                }
                sx={{
                    backgroundColor: alpha(theme.palette.secondary.main, 0.05),
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
                            {patients.map((patient) => (
                                <TableRow key={patient.id} sx={{
                                    '@media print': {
                                        '& td': {
                                            fontSize: '7px !important',
                                            padding: '1mm !important',
                                            border: '1px solid #ddd !important'
                                        }
                                    }
                                }}>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                        {patient.fullName || patient.full_name}
                                        {patient.id === mainPatientId && (
                                            <Chip
                                                label="Main"
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{
                                                    ml: 1,
                                                    height: 20,
                                                    fontSize: '0.7rem',
                                                    '@media print': {
                                                        display: 'inline !important',
                                                        fontSize: '5px !important',
                                                        height: 'auto !important',
                                                        padding: '0.5mm !important'
                                                    }
                                                }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>{formatShortDate(patient.dateOfBirth)}</TableCell>
                                    <TableCell>{(patient.gender * 1) ? "Male" : "Female"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

export default AllPatientsCard;
