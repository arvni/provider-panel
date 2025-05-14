import React, { useState, useEffect } from "react";
import {
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Box,
    Typography,
    useTheme,
    alpha,
    Stack,
    Chip,
    ButtonGroup,
    Button
} from "@mui/material";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { motion } from "framer-motion";

/**
 * Enhanced PageSize component with responsive design and visual feedback
 *
 * @param {number} defaultValue - Default number of items per page
 * @param {function} onChange - Callback function when page size changes
 * @param {number} total - Total number of items (optional)
 * @param {array} options - Custom page size options (optional)
 * @param {string} size - Size of the component ('small', 'medium')
 * @param {boolean} showLabel - Whether to show the label
 * @param {object} sx - Additional styles
 */
const PageSize = ({
                      defaultValue = 10,
                      onChange,
                      total,
                      options = [10, 20, 50, 100],
                      size = "small",
                      showLabel = true,
                      sx = {}
                  }) => {
    const theme = useTheme();
    const [value, setValue] = useState(defaultValue);

    // Update value if defaultValue changes
    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    // Handle change of page size
    const handleChange = (e) => {
        const newValue = e.target.value;
        setValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    // Handle direct button selection
    const handleButtonSelect = (newValue) => () => {
        setValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    // Recommend optimal page size based on total
    const getRecommendedSize = () => {
        if (!total) return null;

        // Logic to recommend a page size based on total items
        if (total <= 20) return 10;
        if (total <= 50) return 20;
        if (total <= 200) return 50;
        return 100;
    };

    const recommendedSize = getRecommendedSize();

    // For compact/mobile view
    const CompactView = () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                Show:
            </Typography>

            <FormControl
                size={size}
                variant="outlined"
                sx={{
                    minWidth: 90,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        backgroundColor: theme.palette.background.paper,
                    },
                    ...sx
                }}
            >
                <Select
                    value={value}
                    onChange={handleChange}
                    displayEmpty
                    renderValue={() => value}
                    IconComponent={KeyboardArrowDownIcon}
                    MenuProps={{
                        anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'right',
                        },
                        transformOrigin: {
                            vertical: 'top',
                            horizontal: 'right',
                        },
                        PaperProps: {
                            elevation: 3,
                            sx: {
                                borderRadius: 2,
                                mt: 0.5,
                                '& .MuiMenuItem-root': {
                                    px: 2,
                                }
                            }
                        }
                    }}
                >
                    {options.map(option => (
                        <MenuItem
                            key={option}
                            value={option}
                            selected={value === option}
                            sx={{
                                fontWeight: value === option ? 600 : 400,
                                py: 1,
                                '&.Mui-selected': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                    }
                                }
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="body2">{option}</Typography>
                                {option === recommendedSize && (
                                    <Chip
                                        label="Recommended"
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{
                                            height: 20,
                                            fontSize: '0.6875rem',
                                            '& .MuiChip-label': {
                                                px: 0.5
                                            }
                                        }}
                                    />
                                )}
                            </Stack>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );

    // For desktop view
    const DesktopView = () => (
        <FormControl
            size={size}
            variant={showLabel ? "outlined" : "standard"}
            sx={{
                minWidth: 150,
                '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                },
                ...sx
            }}
        >
            {showLabel && <InputLabel id="page-size-label">Items per page</InputLabel>}

            <Select
                labelId="page-size-label"
                id="page-size"
                value={value}
                label={showLabel ? "Items per page" : undefined}
                onChange={handleChange}
                MenuProps={{
                    anchorOrigin: {
                        vertical: 'bottom',
                        horizontal: 'center',
                    },
                    transformOrigin: {
                        vertical: 'top',
                        horizontal: 'center',
                    },
                    PaperProps: {
                        elevation: 3,
                        sx: {
                            borderRadius: 2,
                            mt: 0.5,
                            '& .MuiMenuItem-root': {
                                px: 2,
                            }
                        }
                    }
                }}
            >
                {options.map(option => (
                    <MenuItem
                        key={option}
                        value={option}
                        selected={value === option}
                        sx={{
                            fontWeight: value === option ? 600 : 400,
                            py: 1.5,
                            '&.Mui-selected': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                }
                            }
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2">{option} items per page</Typography>
                            {option === recommendedSize && (
                                <Chip
                                    label="Recommended"
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.6875rem'
                                    }}
                                />
                            )}
                        </Stack>
                    </MenuItem>
                ))}
            </Select>

            {total && (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                        mt: 0.5,
                        display: 'block',
                        textAlign: 'center'
                    }}
                >
                    {Math.ceil(total / value)} pages total
                </Typography>
            )}
        </FormControl>
    );

    // Alternative button group view
    const ButtonGroupView = () => (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5
            }}
        >
            {showLabel && (
                <Typography variant="caption" color="text.secondary">
                    Items per page
                </Typography>
            )}

            <ButtonGroup
                variant="outlined"
                size={size}
                aria-label="page size options"
                sx={{
                    '& .MuiButton-root': {
                        minWidth: 48,
                        fontWeight: 500,
                    }
                }}
            >
                {options.slice(0, 4).map(option => (
                    <Button
                        key={option}
                        onClick={handleButtonSelect(option)}
                        variant={value === option ? "contained" : "outlined"}
                        sx={{
                            borderColor: value === option
                                ? theme.palette.primary.main
                                : theme.palette.divider,
                            '&:hover': {
                                backgroundColor: value === option
                                    ? theme.palette.primary.main
                                    : alpha(theme.palette.primary.main, 0.1),
                            }
                        }}
                    >
                        {option}
                    </Button>
                ))}
            </ButtonGroup>
        </Box>
    );

    // Choose which view to display
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {size === "small" ? <CompactView /> : <DesktopView />}
        </motion.div>
    );
};

export default PageSize;
