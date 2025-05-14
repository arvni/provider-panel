import React, { useState, useEffect } from "react";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    Stack,
    Typography,
    Box,
    Chip,
    CardActions,
    alpha,
    useTheme,
    Grid,
    Paper,
    Badge
} from "@mui/material";
import {
    Info as InfoIcon,
    Check as CheckIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    Science as ScienceIcon,
    ExpandMore as ExpandMoreIcon,
    ArrowForward as ArrowForwardIcon,
    Timer as TimerIcon
} from "@mui/icons-material";
import TestDetails from "./TestDetails";
import { motion } from "framer-motion";

/**
 * Enhanced TestCard component with improved design and interactions
 */
const TestCard = (props) => {
    const theme = useTheme();
    const [selected, setSelected] = useState(props.selected);
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);

    // Update selected state when props change
    useEffect(() => {
        setSelected(props.selected);
    }, [props.selected]);

    // Handle test selection/deselection
    const handleSelect = () => {
        setSelected(!selected);
        if (props.test.id) {
            props.onSelect(props.test.id);
        }
    };

    // Handle opening test details dialog
    const handleOpenDetails = () => setOpen(true);

    // Handle closing test details dialog
    const handleCloseDetails = () => setOpen(false);

    // Toggle expanded state
    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    // Format turnaround time with proper display
    const formatTurnaroundTime = (time) => {
        if (!time) return "Not specified";

        const days = parseInt(time, 10);
        if (isNaN(days)) return time;

        return `${days} ${days === 1 ? 'business day' : 'business days'}`;
    };

    return (
        <Card
            component={motion.div}
            whileHover={{
                y: -4,
                boxShadow: theme.shadows[6],
                transition: { duration: 0.2 }
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            elevation={selected ? 6 : 1}
            sx={{
                width: "100%",
                borderRadius: 2,
                border: '1px solid',
                borderColor: selected
                    ? theme.palette.primary.main
                    : theme.palette.divider,
                position: 'relative',
                overflow: 'visible',
                bgcolor: selected
                    ? alpha(theme.palette.primary.main, 0.03)
                    : theme.palette.background.paper,
                transition: 'all 0.3s ease',
            }}
        >
            {/* Selected badge */}
            {selected && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        zIndex: 1
                    }}
                >
                    <Badge
                        badgeContent={
                            <CheckIcon sx={{ fontSize: 12, color: 'white' }} />
                        }
                        color="primary"
                        sx={{
                            '& .MuiBadge-badge': {
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }
                        }}
                    />
                </Box>
            )}

            {/* Card header */}
            <CardHeader
                sx={{
                    p: 2,
                    bgcolor: selected
                        ? alpha(theme.palette.primary.main, 0.05)
                        : alpha(theme.palette.grey[50], 0.5),
                    borderBottom: '1px solid',
                    borderColor: selected
                        ? alpha(theme.palette.primary.main, 0.1)
                        : theme.palette.divider
                }}
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScienceIcon
                            color={selected ? "primary" : "action"}
                            fontSize="small"
                        />
                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            color={selected ? "primary.main" : "text.primary"}
                            sx={{ flex: 1 }}
                        >
                            {props.test.name}
                        </Typography>
                    </Box>
                }
            />

            {/* Card content */}
            <CardContent sx={{ p: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                        <Box sx={{ mb: 2 }}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    display: '-webkit-box',
                                    overflow: 'hidden',
                                    WebkitBoxOrient: 'vertical',
                                    WebkitLineClamp: expanded ? 'unset' : 2,
                                }}
                            >
                                {props.test.description || "No description available for this test."}
                            </Typography>

                            {(props.test.description?.length > 120) && (
                                <Button
                                    size="small"
                                    onClick={handleExpandClick}
                                    endIcon={
                                        <ExpandMoreIcon
                                            sx={{
                                                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.3s'
                                            }}
                                        />
                                    }
                                    sx={{
                                        mt: 1,
                                        textTransform: 'none',
                                        p: 0,
                                        minWidth: 'auto'
                                    }}
                                >
                                    {expanded ? 'Show less' : 'Read more'}
                                </Button>
                            )}
                        </Box>

                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {props.test.categories?.map((category, index) => (
                                <Chip
                                    key={index}
                                    label={category}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        mb: 0.5,
                                        borderRadius: 1,
                                        fontSize: '0.75rem'
                                    }}
                                />
                            ))}

                            {props.test.methods?.map((method, index) => (
                                <Chip
                                    key={index}
                                    label={method}
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                    sx={{
                                        mb: 0.5,
                                        borderRadius: 1,
                                        fontSize: '0.75rem'
                                    }}
                                />
                            ))}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 1.5,
                                borderRadius: 1.5,
                                border: '1px solid',
                                borderColor: theme.palette.divider,
                                backgroundColor: alpha(theme.palette.background.default, 0.5)
                            }}
                        >
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    mb: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                }}
                            >
                                <TimerIcon fontSize="small" color="action" />
                                Turnaround Time
                            </Typography>

                            <Typography
                                variant="body2"
                                fontWeight={500}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: 0.5
                                }}
                            >
                                <Chip
                                    label={formatTurnaroundTime(props.test.turnaroundTime)}
                                    size="small"
                                    color="primary"
                                    variant={selected ? "filled" : "outlined"}
                                    sx={{
                                        borderRadius: 1,
                                        fontWeight: 600,
                                        fontSize: '0.75rem'
                                    }}
                                />
                            </Typography>

                            {props.test.requirements && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            mb: 0.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5
                                        }}
                                    >
                                        <InfoIcon fontSize="small" color="action" />
                                        Requirements
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary">
                                        {props.test.requirements}
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </CardContent>

            {/* Card actions */}
            <CardActions
                sx={{
                    p: 2,
                    pt: 0,
                    display: 'flex',
                    justifyContent: 'space-between'
                }}
            >
                <Button
                    variant="outlined"
                    size="small"
                    color="info"
                    onClick={handleOpenDetails}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none'
                    }}
                >
                    View Details
                </Button>

                <Button
                    variant={selected ? "outlined" : "contained"}
                    size="small"
                    color={selected ? "error" : "primary"}
                    onClick={handleSelect}
                    startIcon={selected ? <RemoveIcon /> : <AddIcon />}
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        minWidth: 120,
                        boxShadow: selected ? 'none' : theme.shadows[1],
                        '&:hover': {
                            boxShadow: selected ? 'none' : theme.shadows[2]
                        }
                    }}
                >
                    {selected ? "Remove Test" : "Add Test"}
                </Button>
            </CardActions>

            {/* Test details dialog */}
            <TestDetails
                test={props.test}
                open={open}
                onClose={handleCloseDetails}
            />
        </Card>
    );
};

export default TestCard;
