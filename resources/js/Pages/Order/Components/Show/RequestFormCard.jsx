import React from "react";
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Grid,
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
 * Request form card on the Order Show page: renders the submitted order-form
 * field/value pairs.
 */
const RequestFormCard = ({ orderForms }) => {
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
                            Request Form
                        </Typography>
                    </Box>
                }
                sx={{
                    py: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
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
                p: { xs: 2, sm: 3 },
                '@media print': {
                    padding: '2mm !important'
                }
            }}>
                <Grid container spacing={3} sx={{
                    '@media print': {
                        gap: '2mm !important',
                        margin: '0 !important'
                    }
                }}>
                    {orderForms?.map(orderForm => (
                        <Grid size={{ xs: 12, md: 6 }} key={orderForm.id} sx={{
                            '@media print': {
                                width: '48% !important',
                                maxWidth: '48% !important',
                                flexBasis: '48% !important',
                                padding: '0 !important'
                            }
                        }}>
                            <TableContainer sx={{
                                '@media print': {
                                    border: 'none !important',
                                    boxShadow: 'none !important'
                                }
                            }}>
                                <Table size="small" sx={{
                                    '@media print': {
                                        fontSize: '7px !important'
                                    }
                                }}>
                                    <TableBody>
                                        {orderForm?.formData.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell
                                                    component="th"
                                                    sx={{
                                                        width: '40%',
                                                        fontWeight: 600,
                                                        borderBottom: index === orderForm.formData.length - 1 ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                        verticalAlign: 'top',
                                                        '@media print': {
                                                            fontSize: '7px !important',
                                                            fontWeight: 'bold !important',
                                                            padding: '1mm !important',
                                                            borderBottom: index === orderForm.formData.length - 1 ? 'none !important' : '1px solid #ccc !important',
                                                            color: '#000 !important'
                                                        }
                                                    }}
                                                >
                                                    {item.label}
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        borderBottom: index === orderForm.formData.length - 1 ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                        '@media print': {
                                                            fontSize: '7px !important',
                                                            padding: '1mm !important',
                                                            borderBottom: index === orderForm.formData.length - 1 ? 'none !important' : '1px solid #ccc !important',
                                                            color: '#000 !important'
                                                        }
                                                    }}
                                                >
                                                    {item.value || "Not specified"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default RequestFormCard;
