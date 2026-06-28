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
import {
    Person as PersonIcon,
    Science as ScienceIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import ConsanguineousParents from "@/Enums/ConsanguineousParents.js";
import { itemVariants } from "@/Pages/Order/Components/orderMotion";
import { formatShortDate } from "@/Pages/Order/Components/orderDisplay";

/**
 * Main patient details card on the Order Show page: a two-column layout with
 * the patient demographics table on the left and contact + per-sample material
 * details on the right.
 */
const PatientDetailsCard = ({ order }) => {
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
                            Patient Details
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
                    <Grid size={{ xs: 12, md: 6 }} sx={{
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
                                    <TableRow>
                                        <TableCell
                                            component="th"
                                            sx={{
                                                width: '40%',
                                                fontWeight: 600,
                                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                verticalAlign: 'top',
                                                '@media print': {
                                                    fontSize: '7px !important',
                                                    fontWeight: 'bold !important',
                                                    padding: '1mm !important',
                                                    borderBottom: '1px solid #ccc !important',
                                                    color: '#000 !important'
                                                }
                                            }}
                                        >
                                            Full Name
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                fontWeight: 500,
                                                '@media print': {
                                                    fontSize: '7px !important',
                                                    padding: '1mm !important',
                                                    borderBottom: '1px solid #ccc !important',
                                                    color: '#000 !important'
                                                }
                                            }}
                                        >
                                            {order.patient?.fullName}
                                        </TableCell>
                                    </TableRow>

                                    <TableRow>
                                        <TableCell
                                            component="th"
                                            sx={{
                                                fontWeight: 600,
                                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                verticalAlign: 'top',
                                                '@media print': {
                                                    fontSize: '7px !important',
                                                    fontWeight: 'bold !important',
                                                    padding: '1mm !important',
                                                    borderBottom: '1px solid #ccc !important',
                                                    color: '#000 !important'
                                                }
                                            }}
                                        >
                                            Date of Birth
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                '@media print': {
                                                    fontSize: '7px !important',
                                                    padding: '1mm !important',
                                                    borderBottom: '1px solid #ccc !important',
                                                    color: '#000 !important'
                                                }
                                            }}
                                        >
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                '@media print': {
                                                    gap: '0.5mm'
                                                }
                                            }}>
                                                <CalendarIcon
                                                    fontSize="small"
                                                    color="action"
                                                    sx={{
                                                        '@media print': {
                                                            display: 'none !important'
                                                        }
                                                    }}
                                                />
                                                {formatShortDate(order.patient?.dateOfBirth)}
                                            </Box>
                                        </TableCell>
                                    </TableRow>

                                    <TableRow>
                                        <TableCell
                                            component="th"
                                            sx={{
                                                fontWeight: 600,
                                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                verticalAlign: 'top',
                                                '@media print': {
                                                    fontSize: '7px !important',
                                                    fontWeight: 'bold !important',
                                                    padding: '1mm !important',
                                                    borderBottom: '1px solid #ccc !important',
                                                    color: '#000 !important'
                                                }
                                            }}
                                        >
                                            Reference ID
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                '@media print': {
                                                    fontSize: '7px !important',
                                                    padding: '1mm !important',
                                                    borderBottom: '1px solid #ccc !important',
                                                    color: '#000 !important'
                                                }
                                            }}
                                        >
                                            {order.patient?.reference_id || "Not specified"}
                                        </TableCell>
                                    </TableRow>

                                    <TableRow>
                                        <TableCell
                                            component="th"
                                            sx={{
                                                fontWeight: 600,
                                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                verticalAlign: 'top',
                                                '@media print': {
                                                    fontSize: '7px !important',
                                                    fontWeight: 'bold !important',
                                                    padding: '1mm !important',
                                                    borderBottom: '1px solid #ccc !important',
                                                    color: '#000 !important'
                                                }
                                            }}
                                        >
                                            Gender
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                '@media print': {
                                                    fontSize: '7px !important',
                                                    padding: '1mm !important',
                                                    borderBottom: '1px solid #ccc !important',
                                                    color: '#000 !important'
                                                }
                                            }}
                                        >
                                            {(order.patient?.gender * 1) ? "Male" : "Female"}
                                        </TableCell>
                                    </TableRow>

                                    <TableRow>
                                        <TableCell
                                            component="th"
                                            sx={{
                                                fontWeight: 600,
                                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                verticalAlign: 'top',
                                                '@media print': {
                                                    fontSize: '7px !important',
                                                    fontWeight: 'bold !important',
                                                    padding: '1mm !important',
                                                    borderBottom: '1px solid #ccc !important',
                                                    color: '#000 !important'
                                                }
                                            }}
                                        >
                                            Nationality
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                '@media print': {
                                                    fontSize: '7px !important',
                                                    padding: '1mm !important',
                                                    borderBottom: '1px solid #ccc !important',
                                                    color: '#000 !important'
                                                }
                                            }}
                                        >
                                            {order.patient?.nationality?.label || "Not specified"}
                                        </TableCell>
                                    </TableRow>

                                    <TableRow>
                                        <TableCell
                                            component="th"
                                            sx={{
                                                fontWeight: 600,
                                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                verticalAlign: 'top',
                                                '@media print': {
                                                    fontSize: '7px !important',
                                                    fontWeight: 'bold !important',
                                                    padding: '1mm !important',
                                                    borderBottom: 'none !important',
                                                    color: '#000 !important'
                                                }
                                            }}
                                        >
                                            Consanguineous Parents
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                '@media print': {
                                                    fontSize: '7px !important',
                                                    padding: '1mm !important',
                                                    borderBottom: 'none !important',
                                                    color: '#000 !important'
                                                }
                                            }}
                                        >
                                            {ConsanguineousParents.get(order.patient?.consanguineousParents)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }} sx={{
                        '@media print': {
                            width: '48% !important',
                            maxWidth: '48% !important',
                            flexBasis: '48% !important',
                            padding: '0 !important'
                        }
                    }}>
                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            sx={{
                                mb: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                '@media print': {
                                    fontSize: '8px !important',
                                    fontWeight: 'bold !important',
                                    marginBottom: '2mm !important',
                                    color: '#000 !important'
                                }
                            }}
                        >
                            <LocationIcon
                                fontSize="small"
                                color="primary"
                                sx={{
                                    '@media print': {
                                        display: 'none !important'
                                    }
                                }}
                            />
                            Contact Information
                        </Typography>

                        <Box sx={{
                            ml: 3,
                            mb: 3,
                            '@media print': {
                                marginLeft: '0 !important',
                                marginBottom: '2mm !important'
                            }
                        }}>
                            {order.patient?.contact?.email && (
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 1,
                                    mb: 1,
                                    '@media print': {
                                        gap: '1mm',
                                        marginBottom: '1mm !important'
                                    }
                                }}>
                                    <EmailIcon
                                        fontSize="small"
                                        color="action"
                                        sx={{
                                            mt: 0.5,
                                            '@media print': {
                                                display: 'none !important'
                                            }
                                        }}
                                    />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            '@media print': {
                                                fontSize: '7px !important',
                                                color: '#000 !important'
                                            }
                                        }}
                                    >
                                        {order.patient?.contact?.email}
                                    </Typography>
                                </Box>
                            )}

                            {order.patient?.contact?.phone && (
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 1,
                                    mb: 1,
                                    '@media print': {
                                        gap: '1mm',
                                        marginBottom: '1mm !important'
                                    }
                                }}>
                                    <PhoneIcon
                                        fontSize="small"
                                        color="action"
                                        sx={{
                                            mt: 0.5,
                                            '@media print': {
                                                display: 'none !important'
                                            }
                                        }}
                                    />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            '@media print': {
                                                fontSize: '7px !important',
                                                color: '#000 !important'
                                            }
                                        }}
                                    >
                                        {order.patient?.contact?.phone}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1,
                                '@media print': {
                                    gap: '1mm'
                                }
                            }}>
                                <LocationIcon
                                    fontSize="small"
                                    color="action"
                                    sx={{
                                        mt: 0.5,
                                        '@media print': {
                                            display: 'none !important'
                                        }
                                    }}
                                />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        '@media print': {
                                            fontSize: '7px !important',
                                            color: '#000 !important'
                                        }
                                    }}
                                >
                                    {[
                                        order.patient?.contact?.address,
                                        order.patient?.contact?.city,
                                        order.patient?.contact?.state,
                                        order.patient?.contact?.country?.label
                                    ].filter(Boolean).join(", ") || "Address not specified"}
                                </Typography>
                            </Box>
                        </Box>

                        {order.order_items && order.order_items.length > 0 && (
                            <>
                                <Typography
                                    variant="subtitle1"
                                    fontWeight={600}
                                    sx={{
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        '@media print': {
                                            fontSize: '8px !important',
                                            fontWeight: 'bold !important',
                                            marginBottom: '2mm !important',
                                            color: '#000 !important'
                                        }
                                    }}
                                >
                                    <ScienceIcon
                                        fontSize="small"
                                        color="primary"
                                        sx={{
                                            '@media print': {
                                                display: 'none !important'
                                            }
                                        }}
                                    />
                                    Material Details
                                </Typography>

                                {order.order_items.map((orderItem, orderItemIndex) => (
                                    orderItem.samples && orderItem.samples.length > 0 && (
                                        <Box key={orderItem.id || orderItemIndex} sx={{ mb: 2 }}>
                                            {/* Test Context */}
                                            {orderItem.test && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        display: 'block',
                                                        ml: 3,
                                                        mb: 1,
                                                        color: 'text.secondary',
                                                        fontWeight: 600,
                                                        '@media print': {
                                                            fontSize: '6px !important',
                                                            marginLeft: '0 !important',
                                                            marginBottom: '1mm !important',
                                                            color: '#666 !important'
                                                        }
                                                    }}
                                                >
                                                    For Test: {orderItem.test.name}
                                                </Typography>
                                            )}

                                            {orderItem.samples.map((sample, sampleIndex) => (
                                                <Box
                                                    key={sample.id || sampleIndex}
                                                    sx={{
                                                        mb: 2,
                                                        ml: 3,
                                                        p: 2,
                                                        borderRadius: 1,
                                                        border: '1px solid',
                                                        borderColor: alpha(theme.palette.primary.main, 0.2),
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.03),
                                                        '@media print': {
                                                            marginLeft: '0 !important',
                                                            marginBottom: '2mm !important',
                                                            padding: '2mm !important',
                                                            border: '1px solid #ccc !important',
                                                            borderRadius: '0 !important',
                                                            backgroundColor: '#f9f9f9 !important'
                                                        }
                                                    }}
                                                >
                                                    <Typography
                                                        variant="subtitle2"
                                                        fontWeight={600}
                                                        sx={{
                                                            mb: 1,
                                                            '@media print': {
                                                                fontSize: '7px !important',
                                                                fontWeight: 'bold !important',
                                                                marginBottom: '1mm !important',
                                                                color: '#000 !important'
                                                            }
                                                        }}
                                                    >
                                                        Sample #{sampleIndex + 1}
                                                    </Typography>

                                                    <Grid container spacing={1} sx={{
                                                        '@media print': {
                                                            gap: '1mm !important',
                                                            margin: '0 !important'
                                                        }
                                                    }}>
                                                        <Grid size={6} sx={{
                                                            '@media print': {
                                                                width: '48% !important',
                                                                maxWidth: '48% !important',
                                                                flexBasis: '48% !important',
                                                                padding: '0 !important'
                                                            }
                                                        }}>
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{
                                                                    '@media print': {
                                                                        fontSize: '6px !important',
                                                                        color: '#666 !important'
                                                                    }
                                                                }}
                                                            >
                                                                Sample Type:
                                                            </Typography>
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight={500}
                                                                sx={{
                                                                    '@media print': {
                                                                        fontSize: '6px !important',
                                                                        fontWeight: 'bold !important',
                                                                        color: '#000 !important'
                                                                    }
                                                                }}
                                                            >
                                                                {sample.sample_type?.name || "Not specified"}
                                                            </Typography>
                                                        </Grid>

                                                        <Grid size={6} sx={{
                                                            '@media print': {
                                                                width: '48% !important',
                                                                maxWidth: '48% !important',
                                                                flexBasis: '48% !important',
                                                                padding: '0 !important'
                                                            }
                                                        }}>
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{
                                                                    '@media print': {
                                                                        fontSize: '6px !important',
                                                                        color: '#666 !important'
                                                                    }
                                                                }}
                                                            >
                                                                Sample ID:
                                                            </Typography>
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight={500}
                                                                sx={{
                                                                    '@media print': {
                                                                        fontSize: '6px !important',
                                                                        fontWeight: 'bold !important',
                                                                        color: '#000 !important'
                                                                    }
                                                                }}
                                                            >
                                                                {sample.sampleId || "Not specified"}
                                                            </Typography>
                                                        </Grid>

                                                        <Grid size={6} sx={{
                                                            '@media print': {
                                                                width: '48% !important',
                                                                maxWidth: '48% !important',
                                                                flexBasis: '48% !important',
                                                                padding: '0 !important'
                                                            }
                                                        }}>
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{
                                                                    '@media print': {
                                                                        fontSize: '6px !important',
                                                                        color: '#666 !important'
                                                                    }
                                                                }}
                                                            >
                                                                Pooling:
                                                            </Typography>
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight={500}
                                                                sx={{
                                                                    '@media print': {
                                                                        fontSize: '6px !important',
                                                                        fontWeight: 'bold !important',
                                                                        color: '#000 !important'
                                                                    }
                                                                }}
                                                            >
                                                                {sample.pooling ? "Yes" : "No"}
                                                            </Typography>
                                                        </Grid>

                                                        <Grid size={6} sx={{
                                                            '@media print': {
                                                                width: '48% !important',
                                                                maxWidth: '48% !important',
                                                                flexBasis: '48% !important',
                                                                padding: '0 !important'
                                                            }
                                                        }}>
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{
                                                                    '@media print': {
                                                                        fontSize: '6px !important',
                                                                        color: '#666 !important'
                                                                    }
                                                                }}
                                                            >
                                                                Collection Date:
                                                            </Typography>
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight={500}
                                                                sx={{
                                                                    '@media print': {
                                                                        fontSize: '6px !important',
                                                                        fontWeight: 'bold !important',
                                                                        color: '#000 !important'
                                                                    }
                                                                }}
                                                            >
                                                                {formatShortDate(sample.collectionDate)}
                                                            </Typography>
                                                        </Grid>

                                                        {sample?.material && (
                                                            <>
                                                                <Grid size={6} sx={{
                                                                    '@media print': {
                                                                        width: '48% !important',
                                                                        maxWidth: '48% !important',
                                                                        flexBasis: '48% !important',
                                                                        padding: '0 !important'
                                                                    }
                                                                }}>
                                                                    <Typography
                                                                        variant="body2"
                                                                        color="text.secondary"
                                                                        sx={{
                                                                            '@media print': {
                                                                                fontSize: '6px !important',
                                                                                color: '#666 !important'
                                                                            }
                                                                        }}
                                                                    >
                                                                        Material Barcode:
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="body2"
                                                                        fontWeight={500}
                                                                        sx={{
                                                                            '@media print': {
                                                                                fontSize: '6px !important',
                                                                                fontWeight: 'bold !important',
                                                                                color: '#000 !important'
                                                                            }
                                                                        }}
                                                                    >
                                                                        {sample.material?.barcode || "Not specified"}
                                                                    </Typography>
                                                                </Grid>

                                                                {sample.material.expire_date && (
                                                                    <Grid size={6} sx={{
                                                                        '@media print': {
                                                                            width: '48% !important',
                                                                            maxWidth: '48% !important',
                                                                            flexBasis: '48% !important',
                                                                            padding: '0 !important'
                                                                        }
                                                                    }}>
                                                                        <Typography
                                                                            variant="body2"
                                                                            color="text.secondary"
                                                                            sx={{
                                                                                '@media print': {
                                                                                    fontSize: '6px !important',
                                                                                    color: '#666 !important'
                                                                                }
                                                                            }}
                                                                        >
                                                                            Expire Date:
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="body2"
                                                                            fontWeight={500}
                                                                            sx={{
                                                                                '@media print': {
                                                                                    fontSize: '6px !important',
                                                                                    fontWeight: 'bold !important',
                                                                                    color: '#000 !important'
                                                                                }
                                                                            }}
                                                                        >
                                                                            {formatShortDate(sample.material?.expire_date)}
                                                                        </Typography>
                                                                    </Grid>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Patient Assignment */}
                                                        {sample?.patient && (
                                                            <Grid size={6} sx={{
                                                                '@media print': {
                                                                    width: '48% !important',
                                                                    maxWidth: '48% !important',
                                                                    flexBasis: '48% !important',
                                                                    padding: '0 !important'
                                                                }
                                                            }}>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                    sx={{
                                                                        '@media print': {
                                                                            fontSize: '6px !important',
                                                                            color: '#666 !important'
                                                                        }
                                                                    }}
                                                                >
                                                                    Patient:
                                                                </Typography>
                                                                <Typography
                                                                    variant="body2"
                                                                    fontWeight={500}
                                                                    sx={{
                                                                        '@media print': {
                                                                            fontSize: '6px !important',
                                                                            fontWeight: 'bold !important',
                                                                            color: '#000 !important'
                                                                        }
                                                                    }}
                                                                >
                                                                    {sample.patient?.fullName || sample.patient?.full_name || "Not specified"}
                                                                </Typography>
                                                            </Grid>
                                                        )}
                                                    </Grid>
                                                </Box>
                                            ))}
                                        </Box>
                                    )
                                ))}
                            </>
                        )}
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default PatientDetailsCard;
