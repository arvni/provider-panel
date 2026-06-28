import React from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Grid,
    Typography,
    useTheme,
    alpha,
} from "@mui/material";
import {
    Download as DownloadIcon,
    FileCopy as FileCopyIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { itemVariants } from "@/Pages/Order/Components/orderMotion";

/**
 * Clinical-details files card on the Order Show page: links to each uploaded
 * file.
 */
const ClinicalFilesCard = ({ files }) => {
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
                        <FileCopyIcon sx={{
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
                            Clinical Details Files
                        </Typography>
                        <Chip
                            label={`${files.length} ${files.length === 1 ? 'file' : 'files'}`}
                            size="small"
                            color="primary"
                            sx={{
                                '@media print': {
                                    display: 'none !important'
                                }
                            }}
                        />
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
                        gap: '2mm !important',
                        margin: '0 !important'
                    }
                }}>
                    {files.map((file, index) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} sx={{
                            '@media print': {
                                width: '100% !important',
                                maxWidth: '100% !important',
                                flexBasis: '100% !important',
                                padding: '0 !important',
                                marginBottom: '1mm !important'
                            }
                        }}>
                            <Box sx={{
                                p: 2,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: alpha(theme.palette.primary.main, 0.2),
                                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                },
                                '@media print': {
                                    padding: '1mm !important',
                                    border: '1px solid #ccc !important',
                                    borderRadius: '0 !important',
                                    backgroundColor: '#f9f9f9 !important',
                                    display: 'block !important'
                                }
                            }}>
                                <FileCopyIcon
                                    color="primary"
                                    sx={{
                                        fontSize: 32,
                                        '@media print': {
                                            display: 'none !important'
                                        }
                                    }}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        variant="body2"
                                        fontWeight={500}
                                        sx={{
                                            mb: 0.5,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            '@media print': {
                                                fontSize: '7px !important',
                                                fontWeight: 'bold !important',
                                                color: '#000 !important',
                                                marginBottom: '0 !important',
                                                whiteSpace: 'normal !important',
                                                wordBreak: 'break-all !important'
                                            }
                                        }}
                                    >
                                        File {index + 1}
                                    </Typography>
                                    <Button
                                        href={"/files/" + file}
                                        target="_blank"
                                        variant="text"
                                        size="small"
                                        startIcon={<DownloadIcon />}
                                        sx={{
                                            textTransform: 'none',
                                            fontSize: '0.75rem',
                                            p: 0,
                                            minWidth: 0,
                                            '@media print': {
                                                display: 'inline !important',
                                                fontSize: '6px !important',
                                                padding: '0 !important',
                                                color: '#1976d2 !important',
                                                textDecoration: 'underline !important'
                                            }
                                        }}
                                    >
                                        <span style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            display: 'block',
                                            maxWidth: '200px'
                                        }}>
                                            {file.split('/').pop()}
                                        </span>
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default ClinicalFilesCard;
