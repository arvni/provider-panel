import React from "react";
import {
    Avatar,
    Button,
    Card,
    CardContent,
    CardHeader,
    Grid,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
    Stack,
    Typography,
    Box,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Tooltip,
    IconButton,
    useTheme,
    alpha
} from "@mui/material";
import ClientLayout from "@/Layouts/AuthenticatedLayout";
import {
    Close,
    Done,
    Download as DownloadIcon,
    FileCopy as FileCopyIcon,
    Print as PrintIcon,
    Person as PersonIcon,
    Science as ScienceIcon,
    Assignment as AssignmentIcon,
    FactCheck as FactCheckIcon,
    ContentCopy as ContentCopyIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    CalendarToday as CalendarIcon
} from "@mui/icons-material";
import ConsanguineousParents from "@/Enums/ConsanguineousParents.js";
import { motion } from "framer-motion";

/**
 * Enhanced Order Show component with A5 print optimization
 */
const Show = ({ order: { consents, ...restOrder } }) => {
    const theme = useTheme();

    // Process consents data
    let consentForm, restConsents;
    if (Array.isArray(consents)) {
        restConsents = consents;
        consentForm = null;
    } else {
        consentForm = consents.consentForm;
        restConsents = Object.keys(consents)
            .filter(item => item !== "consentForm")
            .map(item => consents?.[item]);
    }

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.1,
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.4 }
        }
    };

    // Handle print functionality
    const handlePrint = () => {
        window.print();
    };

    // Copy order ID to clipboard
    const copyOrderId = () => {
        navigator.clipboard.writeText(restOrder.id.toString());
    };

    // Format date string
    const formatDate = (dateString) => {
        if (!dateString) return "Not specified";

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <Box
            component={motion.div}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            sx={{
                width: "100%",
                '@media print': {
                    // A5 paper dimensions and settings
                    '@page': {
                        size: 'A5',
                        margin: '10mm'
                    },
                    margin: 0,
                    padding: 0,
                    fontSize: '9px',
                    lineHeight: 1.2,
                    color: '#000 !important',
                    backgroundColor: '#fff !important'
                }
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 3 },
                    mt: 2,
                    mb: 4,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    overflow: 'hidden',
                    '@media print': {
                        boxShadow: 'none !important',
                        border: 'none !important',
                        borderRadius: '0 !important',
                        margin: '0 !important',
                        padding: '5mm !important',
                        backgroundColor: '#fff !important'
                    }
                }}
            >
                {/* Header Section */}
                <Box
                    component={motion.div}
                    variants={itemVariants}
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: 2,
                        mb: 3,
                        pb: 2,
                        borderBottom: '1px solid',
                        borderColor: theme.palette.divider,
                        '@media print': {
                            display: 'block !important',
                            marginBottom: '3mm !important',
                            paddingBottom: '2mm !important',
                            borderBottom: '1px solid #000 !important',
                            pageBreakInside: 'avoid'
                        }
                    }}
                >
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        '@media print': {
                            gap: '1mm'
                        }
                    }}>
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                '@media print': {
                                    display: 'none !important'
                                }
                            }}
                        >
                            <AssignmentIcon />
                        </Box>
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography
                                    component="h1"
                                    variant="h5"
                                    fontWeight={700}
                                    sx={{
                                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                        '@media print': {
                                            fontSize: '12px !important',
                                            fontWeight: 'bold !important',
                                            margin: '0 !important',
                                            color: '#000 !important'
                                        }
                                    }}
                                >
                                    Order #{restOrder.id}
                                </Typography>
                                <Tooltip title="Copy Order ID">
                                    <IconButton
                                        size="small"
                                        onClick={copyOrderId}
                                        sx={{
                                            '@media print': {
                                                display: 'none !important'
                                            }
                                        }}
                                    >
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    '@media print': {
                                        fontSize: '8px !important',
                                        color: '#666 !important',
                                        margin: '0 !important'
                                    }
                                }}
                            >
                                Created: {formatDate(restOrder.created_at || restOrder.createdAt)}
                            </Typography>
                        </Box>
                    </Box>

                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            '@media print': {
                                display: 'none !important'
                            }
                        }}
                    >
                        <Tooltip title="Print Order">
                            <IconButton
                                onClick={handlePrint}
                                sx={{
                                    border: '1px solid',
                                    borderColor: theme.palette.divider,
                                    borderRadius: 1
                                }}
                            >
                                <PrintIcon />
                            </IconButton>
                        </Tooltip>

                        <Button
                            href={route("order-summary", restOrder.id)}
                            target="_blank"
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            sx={{
                                borderRadius: 1,
                                textTransform: 'none',
                                boxShadow: 'none',
                                '&:hover': {
                                    boxShadow: theme.shadows[2]
                                }
                            }}
                        >
                            Download Summary
                        </Button>
                    </Stack>
                </Box>

                {/* Tests Section */}
                <Box
                    component={motion.div}
                    variants={itemVariants}
                    sx={{
                        mb: 4,
                        '@media print': {
                            marginBottom: '3mm !important',
                            pageBreakInside: 'avoid'
                        }
                    }}
                >
                    <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            '@media print': {
                                fontSize: '10px !important',
                                fontWeight: 'bold !important',
                                marginBottom: '2mm !important',
                                color: '#000 !important'
                            }
                        }}
                    >
                        <ScienceIcon
                            color="primary"
                            sx={{
                                '@media print': {
                                    display: 'none !important'
                                }
                            }}
                        />
                        Analysis Requested
                    </Typography>

                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            ml: 4,
                            '@media print': {
                                marginLeft: '0 !important',
                                gap: '1mm !important'
                            }
                        }}
                    >
                        {restOrder.tests.map((test, index) => (
                            <Chip
                                key={index}
                                label={test.name}
                                color="primary"
                                variant="outlined"
                                sx={{
                                    fontWeight: 500,
                                    borderRadius: 1,
                                    height: 32,
                                    '@media print': {
                                        fontSize: '7px !important',
                                        height: 'auto !important',
                                        padding: '1mm !important',
                                        border: '1px solid #000 !important',
                                        borderRadius: '2px !important',
                                        backgroundColor: '#f5f5f5 !important',
                                        color: '#000 !important'
                                    }
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                {/* Patient Details Card */}
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
                            <Grid item xs={12} md={6} sx={{
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
                                                    {restOrder.patient?.fullName}
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
                                                        {formatDate(restOrder.patient?.dateOfBirth)}
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
                                                    {restOrder.patient?.reference_id || "Not specified"}
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
                                                    {(restOrder.patient?.gender * 1) ? "Male" : "Female"}
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
                                                    {restOrder.patient?.nationality?.label || "Not specified"}
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
                                                    {ConsanguineousParents.get(restOrder.patient?.consanguineousParents)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>

                            <Grid item xs={12} md={6} sx={{
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
                                    {restOrder.patient?.contact?.email && (
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
                                                {restOrder.patient?.contact?.email}
                                            </Typography>
                                        </Box>
                                    )}

                                    {restOrder.patient?.contact?.phone && (
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
                                                {restOrder.patient?.contact?.phone}
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
                                                restOrder.patient?.contact?.address,
                                                restOrder.patient?.contact?.city,
                                                restOrder.patient?.contact?.state,
                                                restOrder.patient?.contact?.country?.label
                                            ].filter(Boolean).join(", ") || "Address not specified"}
                                        </Typography>
                                    </Box>
                                </Box>

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

                                {restOrder.samples?.map((sample, index) => (
                                    <Box
                                        key={sample.id}
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
                                            Sample #{index + 1}
                                        </Typography>

                                        <Grid container spacing={1} sx={{
                                            '@media print': {
                                                gap: '1mm !important',
                                                margin: '0 !important'
                                            }
                                        }}>
                                            <Grid item xs={6} sx={{
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

                                            <Grid item xs={6} sx={{
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

                                            <Grid item xs={6} sx={{
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
                                                    {formatDate(sample.collectionDate)}
                                                </Typography>
                                            </Grid>

                                            {sample?.material && (
                                                <Grid item xs={6} sx={{
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
                                                        {formatDate(sample.material?.expire_date)}
                                                    </Typography>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Box>
                                ))}
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Request Form Card */}
                {restOrder?.orderForms?.length > 0 && (
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
                                {restOrder?.orderForms?.map(orderForm => (
                                    <Grid item xs={12} md={6} key={orderForm.id} sx={{
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
                )}

                {/* Consent Card */}
                <Card
                    component={motion.div}
                    variants={itemVariants}
                    elevation={0}
                    sx={{
                        mb: 0,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        overflow: 'hidden',
                        '@media print': {
                            border: '1px solid #000 !important',
                            borderRadius: '0 !important',
                            marginBottom: '0 !important',
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
                                <FactCheckIcon sx={{
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
                                    Consent
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
                        <Grid container spacing={2} sx={{
                            '@media print': {
                                gap: '1mm !important',
                                margin: '0 !important'
                            }
                        }}>
                            <Grid item xs={12}>
                                <List sx={{
                                    p: 0,
                                    '@media print': {
                                        padding: '0 !important'
                                    }
                                }}>
                                    {restConsents?.map((consent, index) => (
                                        <ListItem
                                            key={index}
                                            disablePadding
                                            sx={{
                                                py: 1,
                                                px: 0,
                                                borderBottom: index === restConsents.length - 1 && !consentForm?.length ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                                                '@media print': {
                                                    padding: '1mm 0 !important',
                                                    borderBottom: index === restConsents.length - 1 && !consentForm?.length ? 'none !important' : '1px solid #ddd !important'
                                                }
                                            }}
                                        >
                                            <ListItemAvatar sx={{
                                                minWidth: 45,
                                                '@media print': {
                                                    minWidth: '8mm !important'
                                                }
                                            }}>
                                                <Avatar
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        bgcolor: consent?.value ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                                                        color: consent?.value ? theme.palette.success.main : theme.palette.error.main,
                                                        '@media print': {
                                                            width: '6mm !important',
                                                            height: '6mm !important',
                                                            backgroundColor: consent?.value ? '#e8f5e8 !important' : '#ffeaea !important',
                                                            color: consent?.value ? '#2e7d32 !important' : '#d32f2f !important'
                                                        }
                                                    }}
                                                >
                                                    {consent?.value ? <Done sx={{
                                                        '@media print': {
                                                            fontSize: '3mm !important'
                                                        }
                                                    }} /> : <Close sx={{
                                                        '@media print': {
                                                            fontSize: '3mm !important'
                                                        }
                                                    }} />}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={500}
                                                        sx={{
                                                            '@media print': {
                                                                fontSize: '7px !important',
                                                                fontWeight: 'normal !important',
                                                                color: '#000 !important'
                                                            }
                                                        }}
                                                    >
                                                        {consent?.title}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    ))}

                                    {consentForm?.length > 0 && (
                                        <ListItem
                                            disablePadding
                                            sx={{
                                                py: 2,
                                                '@media print': {
                                                    padding: '2mm 0 !important'
                                                }
                                            }}
                                        >
                                            <ListItemAvatar sx={{
                                                minWidth: 45,
                                                '@media print': {
                                                    minWidth: '8mm !important'
                                                }
                                            }}>
                                                <Avatar
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                        color: theme.palette.primary.main,
                                                        '@media print': {
                                                            width: '6mm !important',
                                                            height: '6mm !important',
                                                            backgroundColor: '#e3f2fd !important',
                                                            color: '#1976d2 !important'
                                                        }
                                                    }}
                                                >
                                                    <FileCopyIcon sx={{
                                                        '@media print': {
                                                            fontSize: '3mm !important'
                                                        }
                                                    }} />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={600}
                                                        sx={{
                                                            '@media print': {
                                                                fontSize: '7px !important',
                                                                fontWeight: 'bold !important',
                                                                color: '#000 !important'
                                                            }
                                                        }}
                                                    >
                                                        Consent Form
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Box sx={{
                                                        mt: 1,
                                                        '@media print': {
                                                            marginTop: '1mm !important'
                                                        }
                                                    }}>
                                                        {consentForm?.map((item, index) => (
                                                            <Button
                                                                key={index}
                                                                href={"/files/" + item}
                                                                target="_blank"
                                                                variant="outlined"
                                                                size="small"
                                                                startIcon={<DownloadIcon sx={{
                                                                    '@media print': {
                                                                        display: 'none !important'
                                                                    }
                                                                }} />}
                                                                sx={{
                                                                    mr: 1,
                                                                    mb: 1,
                                                                    borderRadius: 1,
                                                                    textTransform: 'none',
                                                                    '@media print': {
                                                                        display: 'inline-block !important',
                                                                        fontSize: '6px !important',
                                                                        padding: '1mm !important',
                                                                        margin: '0.5mm !important',
                                                                        border: '1px solid #000 !important',
                                                                        borderRadius: '1mm !important',
                                                                        backgroundColor: '#f5f5f5 !important',
                                                                        color: '#000 !important',
                                                                        textDecoration: 'none !important',
                                                                        minHeight: 'auto !important'
                                                                    }
                                                                }}
                                                            >
                                                                <span style={{
                                                                    '@media print': {
                                                                        fontSize: '6px !important'
                                                                    }
                                                                }}>
                                                                    Form {index + 1}
                                                                </span>
                                                            </Button>
                                                        ))}
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    )}
                                </List>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Paper>
        </Box>
    );
};

// Define breadcrumbs for layout
const breadcrumbs = [
    {
        title: "Orders",
        link: route("orders.index"),
        icon: null
    },
];

// Set layout for the page
Show.layout = (page) => (
    <ClientLayout
        auth={page.props.auth}
        breadcrumbs={[
            ...breadcrumbs,
            {
                title: "Order #" + page.props.order.id,
                link: "",
                icon: null
            },
        ]}
        children={page}
    />
);

export default Show;
