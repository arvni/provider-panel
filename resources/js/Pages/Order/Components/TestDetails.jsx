import React, {useState} from "react";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    Button,
    Box,
    Divider,
    Chip,
    IconButton,
    Grid,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Tooltip,
    useTheme,
    alpha,
    Slide,
    useMediaQuery,
    CircularProgress
} from "@mui/material";
import {
    Close as CloseIcon,
    Download as DownloadIcon,
    Description as DescriptionIcon,
    Assignment as AssignmentIcon,
    FileCopy as FileCopyIcon,
    AccessTime as TimeIcon,
    ScienceOutlined as ScienceIcon,
    Info as InfoIcon,
    ArrowBack as ArrowBackIcon,
    AttachFile as AttachFileIcon
} from "@mui/icons-material";

/**
 * Enhanced TestDetails component with better organization and visual design
 */
const TestDetails = ({ test, open = false, onClose }) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const [downloading, setDownloading] = useState({});

    // Animation for the dialog
    const Transition = React.forwardRef(function Transition(props, ref) {
        return <Slide direction="up" ref={ref} {...props} />;
    });

    // Handle file download
    const handleDownload = (type) => () => {
        setDownloading({ ...downloading, [type]: true });

        // Simulate download delay
        setTimeout(() => {
            setDownloading({ ...downloading, [type]: false });
        }, 1000);
    };

    // Format turnaround time with proper display
    const formatTurnaroundTime = (time) => {
        if (!time) return "Not specified";

        const days = parseInt(time, 10);
        if (isNaN(days)) return time;

        return `${days} ${days === 1 ? 'business day' : 'business days'}`;
    };

    // Group files by type for better organization
    const getGroupedFiles = () => {
        const files = [];

        if (test?.order_form_file) {
            files.push({
                type: 'orderForm',
                id: test?.order_form_id,
                name: 'Order Form',
                icon: <AssignmentIcon />,
                route: route("file", { type: "orderForm", id: test?.order_form_id })
            });
        }

        if (test?.consent_file) {
            files.push({
                type: 'consent',
                id: test?.consent_id,
                name: 'Consent Form',
                icon: <FileCopyIcon />,
                route: route("file", { type: "consent", id: test?.consent_id })
            });
        }

        if (test?.instruction_file) {
            files.push({
                type: 'instruction',
                id: test?.instruction_id,
                name: 'Instruction',
                icon: <DescriptionIcon />,
                route: route("file", { type: "instruction", id: test?.instruction_id })
            });
        }

        return files;
    };

    const files = getGroupedFiles();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={fullScreen}
            fullWidth
            maxWidth="md"
            TransitionComponent={Transition}
            PaperProps={{
                elevation: 5,
                sx: {
                    borderRadius: 2,
                    overflow: 'hidden'
                }
            }}
        >
            {/* Dialog title with close button */}
            <DialogTitle
                sx={{
                    p: 2,
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                <ScienceIcon sx={{ mr: 1 }} />
                <Typography
                    variant="h6"
                    component="div"
                    sx={{
                        flexGrow: 1,
                        fontWeight: 600
                    }}
                >
                    {test?.name || 'Test Details'}
                </Typography>
                <IconButton
                    edge="end"
                    color="inherit"
                    onClick={onClose}
                    aria-label="close"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                dividers
                sx={{
                    p: 0,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Test overview section */}
                <Box sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Typography
                                variant="subtitle1"
                                fontWeight={600}
                                sx={{
                                    mb: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}
                            >
                                <InfoIcon color="primary" />
                                About This Test
                            </Typography>

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: theme.palette.divider,
                                    mb: 3
                                }}
                            >
                                <Box
                                    sx={{
                                        '& p': { margin: '0 0 16px 0' },
                                        '& ul': { marginBottom: '16px' },
                                        '& a': { color: theme.palette.primary.main },
                                        '& img': { maxWidth: '100%', height: 'auto' }
                                    }}
                                    dangerouslySetInnerHTML={{ __html: test?.description || 'No description available.' }}
                                />
                            </Paper>

                            {/* Categories and methods */}
                            {(test?.categories?.length > 0 || test?.methods?.length > 0) && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        Categories & Methods
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                        {test?.categories?.map((category, index) => (
                                            <Chip
                                                key={`category-${index}`}
                                                label={category}
                                                size="small"
                                                color="default"
                                                variant="outlined"
                                                sx={{ borderRadius: 1 }}
                                            />
                                        ))}

                                        {test?.methods?.map((method, index) => (
                                            <Chip
                                                key={`method-${index}`}
                                                label={method}
                                                size="small"
                                                color="info"
                                                variant="outlined"
                                                sx={{ borderRadius: 1 }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Grid>

                        <Grid item xs={12} md={4}>
                            {/* Turnaround time card */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: theme.palette.divider,
                                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                                    mb: 3
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={600}
                                    sx={{
                                        mb: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}
                                >
                                    <TimeIcon color="primary" fontSize="small" />
                                    Turnaround Time
                                </Typography>

                                <Chip
                                    label={formatTurnaroundTime(test?.turnaroundTime)}
                                    color="primary"
                                    sx={{
                                        fontWeight: 500,
                                        mt: 1,
                                        borderRadius: 1
                                    }}
                                />
                            </Paper>

                            {/* Required files section */}
                            {files.length > 0 && (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: theme.palette.divider,
                                        bgcolor: alpha(theme.palette.info.main, 0.03),
                                    }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight={600}
                                        sx={{
                                            mb: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                        }}
                                    >
                                        <AttachFileIcon color="info" fontSize="small" />
                                        Required Forms
                                    </Typography>

                                    <List disablePadding>
                                        {files.map((file, index) => (
                                            <React.Fragment key={file.type}>
                                                {index > 0 && <Divider component="li" />}
                                                <ListItem disablePadding sx={{ py: 1 }}>
                                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                                        {file.icon}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={file.name}
                                                        primaryTypographyProps={{
                                                            variant: 'body2',
                                                            fontWeight: 500
                                                        }}
                                                    />
                                                    <Tooltip title={`Download ${file.name}`}>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            color="primary"
                                                            href={file.route}
                                                            target="_blank"
                                                            startIcon={
                                                                downloading[file.type] ? (
                                                                    <CircularProgress size={16} color="inherit" />
                                                                ) : (
                                                                    <DownloadIcon fontSize="small" />
                                                                )
                                                            }
                                                            onClick={handleDownload(file.type, file.id)}
                                                            sx={{
                                                                borderRadius: 1.5,
                                                                textTransform: 'none',
                                                                minWidth: 0,
                                                                '& .MuiButton-startIcon': {
                                                                    mr: 0
                                                                },
                                                                px: { xs: 1, sm: 2 }
                                                            }}
                                                        >
                                                            <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                                                Download
                                                            </Box>
                                                        </Button>
                                                    </Tooltip>
                                                </ListItem>
                                            </React.Fragment>
                                        ))}
                                    </List>
                                </Paper>
                            )}
                        </Grid>
                    </Grid>
                </Box>

                {/* Sample requirements section */}
                {test?.sample_types && test.sample_types.length > 0 && (
                    <Box sx={{ p: 3, pt: 0 }}>
                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            sx={{
                                mt: 3,
                                mb: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            <ScienceIcon color="primary" />
                            Accepted Sample Requirements
                        </Typography>

                        <Grid container spacing={2}>
                            {test.sample_types.map((sampleType, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            height: '100%',
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: theme.palette.divider,
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight={600}
                                            color="primary.main"
                                            gutterBottom
                                        >
                                            {sampleType.sample_type.name}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary">
                                            {sampleType?.description || "No specific requirements"}
                                        </Typography>

                                        {sampleType.additional_info && (
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    <strong>Additional Info:</strong> {sampleType.additional_info}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </DialogContent>

            <DialogActions
                sx={{
                    p: 2,
                    borderTop: '1px solid',
                    borderColor: theme.palette.divider,
                    display: 'flex',
                    justifyContent: 'space-between'
                }}
            >
                <Button
                    variant="outlined"
                    color="inherit"
                    onClick={onClose}
                    startIcon={<ArrowBackIcon />}
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none'
                    }}
                >
                    Back to Test Catalog
                </Button>

                {files.length > 0 && (
                    <Box>
                        {files.map((file) => (
                            <Button
                                key={file.type}
                                variant="outlined"
                                color="primary"
                                href={file.route}
                                target="_blank"
                                startIcon={<DownloadIcon />}
                                sx={{
                                    ml: 1,
                                    borderRadius: 1.5,
                                    textTransform: 'none'
                                }}
                            >
                                {file.name}
                            </Button>
                        ))}
                    </Box>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default TestDetails;
