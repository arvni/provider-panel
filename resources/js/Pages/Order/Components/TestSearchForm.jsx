import React, { useState, useEffect } from "react";
import {
    Button,
    Divider,
    InputAdornment,
    Stack,
    TextField,
    Box,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Typography,
    IconButton,
    useTheme,
    alpha,
    Collapse,
    Paper,
    Grid
} from "@mui/material";
import {
    Search as SearchIcon,
    Clear as ClearIcon,
    FilterAlt as FilterIcon,
    Science as ScienceIcon,
    BiotechOutlined as GeneIcon,
    MedicalServices as DiseaseIcon,
    ExpandMore as ExpandMoreIcon,
    History as HistoryIcon
} from "@mui/icons-material";
import { motion } from "framer-motion";

/**
 * Enhanced TestSearchForm with improved design and functionality
 *
 * @param {Object} props - Component props
 * @param {Object} props.defaultValues - Default search values
 * @param {Function} props.onSearch - Search handler function
 * @param {Array} props.recentSearches - Recent searches (optional)
 * @param {Function} props.onSaveSearch - Handler to save a search (optional)
 * @param {Boolean} props.showFilters - Whether to show advanced filters
 * @param {Function} props.onToggleFilters - Handler to toggle filters visibility
 */
const TestSearchForm = (props) => {
    const theme = useTheme();
    const [values, setValues] = useState(props.defaultValues ?? {
        search: "",
        type: "test"
    });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [recentSearches, setRecentSearches] = useState(props.recentSearches || []);
    const [expanded, setExpanded] = useState(false);

    // Keep track of local storage for recent searches
    useEffect(() => {
        const storedSearches = localStorage.getItem('recentTestSearches');
        if (storedSearches) {
            try {
                setRecentSearches(JSON.parse(storedSearches).slice(0, 5));
            } catch (e) {
                // Handle parsing error
                setRecentSearches([]);
            }
        }
    }, []);

    // Save recent searches
    const saveSearch = (searchTerm) => {
        if (!searchTerm) return;

        const updatedSearches = [
            searchTerm,
            ...recentSearches.filter(term => term !== searchTerm)
        ].slice(0, 5);

        setRecentSearches(updatedSearches);
        localStorage.setItem('recentTestSearches', JSON.stringify(updatedSearches));

        if (props.onSaveSearch) {
            props.onSaveSearch(updatedSearches);
        }
    };

    // Form submission handler
    const submitHandler = (e) => {
        e.preventDefault();
        if (values.search) {
            saveSearch(values.search);
        }
        props.onSearch(values);
        setShowSuggestions(false);
    };

    // Input change handler
    const changeHandler = (e) => {
        setValues(prevState => ({
            ...prevState,
            [e.target.name]: e.target.value
        }));

        if (e.target.name === 'search') {
            setShowSuggestions(e.target.value.length > 0);
        }
    };

    // Clear search input
    const clearSearch = () => {
        setValues(prevState => ({
            ...prevState,
            search: ""
        }));
        setShowSuggestions(false);
    };

    // Use a suggestion
    const useSuggestion = (suggestion) => () => {
        setValues(prevState => ({
            ...prevState,
            search: suggestion
        }));
        setShowSuggestions(false);

        // Submit the form with the selected suggestion
        props.onSearch({
            ...values,
            search: suggestion
        });
    };

    // Toggle advanced search options
    const toggleAdvanced = () => {
        setExpanded(!expanded);
    };

    // Animations
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.3 }
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <Box
                component="form"
                onSubmit={submitHandler}
                sx={{
                    position: 'relative',
                    mb: expanded ? 3 : 0
                }}
            >
                <TextField
                    id="test-search-input"
                    placeholder="Search for tests, genes, or diseases..."
                    fullWidth
                    name="search"
                    value={values.search}
                    onChange={changeHandler}
                    onFocus={() => {
                        if (values.search && recentSearches.length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                    onBlur={() => {
                        // Delay hiding suggestions to allow for clicks
                        setTimeout(() => {
                            setShowSuggestions(false);
                        }, 200);
                    }}
                    variant="outlined"
                    autoComplete="off"
                    InputProps={{
                        sx: {
                            borderRadius: "28px",
                            pr: 0,
                            pl: 2,
                            py: 0.5,
                            backgroundColor: theme.palette.background.paper,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                            },
                            '&.Mui-focused': {
                                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                            }
                        },
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <Stack
                                    spacing={1}
                                    direction="row"
                                    alignItems="center"
                                    sx={{ height: '100%' }}
                                >
                                    {values.search && (
                                        <IconButton
                                            aria-label="clear search"
                                            onClick={clearSearch}
                                            edge="end"
                                            size="small"
                                        >
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    )}

                                    <Divider orientation="vertical" flexItem />

                                    <FormControl
                                        variant="standard"
                                        sx={{
                                            width: "100px",
                                            mr: 1,
                                            '& .MuiSelect-select': {
                                                py: 1.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5
                                            }
                                        }}
                                    >
                                        <Select
                                            value={values.type}
                                            onChange={changeHandler}
                                            name="type"
                                            disableUnderline
                                            sx={{
                                                '& .MuiSelect-icon': {
                                                    color: theme.palette.text.secondary
                                                }
                                            }}
                                        >
                                            <MenuItem value="test">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <ScienceIcon fontSize="small" />
                                                    <Typography variant="body2">Test</Typography>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="gene">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <GeneIcon fontSize="small" />
                                                    <Typography variant="body2">Gene</Typography>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="disease">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <DiseaseIcon fontSize="small" />
                                                    <Typography variant="body2">Disease</Typography>
                                                </Box>
                                            </MenuItem>
                                        </Select>
                                    </FormControl>

                                    <Button
                                        variant="contained"
                                        color="primary"
                                        type="submit"
                                        sx={{
                                            borderRadius: "24px",
                                            px: 3,
                                            py: 1,
                                            textTransform: 'none',
                                            boxShadow: 'none',
                                            '&:hover': {
                                                boxShadow: theme.shadows[2]
                                            }
                                        }}
                                    >
                                        Search
                                    </Button>
                                </Stack>
                            </InputAdornment>)
                    }}
                />

                {/* Recent searches dropdown */}
                {showSuggestions && recentSearches.length > 0 && (
                    <Paper
                        elevation={4}
                        sx={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            mt: 0.5,
                            zIndex: 10,
                            borderRadius: 2,
                            overflow: 'hidden',
                            py: 1
                        }}
                    >
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                px: 2,
                                py: 0.5,
                                gap: 0.5,
                                fontWeight: 500
                            }}
                        >
                            <HistoryIcon fontSize="small" />
                            Recent Searches
                        </Typography>

                        <Divider sx={{ mb: 1 }} />

                        {recentSearches.map((search, index) => (
                            <MenuItem
                                key={index}
                                onClick={useSuggestion(search)}
                                sx={{
                                    py: 1,
                                    px: 2,
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.08)
                                    }
                                }}
                            >
                                <Typography variant="body2">
                                    <Box component="span" sx={{ mr: 1, opacity: 0.6 }}>
                                        <SearchIcon fontSize="small" />
                                    </Box>
                                    {search}
                                </Typography>
                            </MenuItem>
                        ))}
                    </Paper>
                )}

                {/* Advanced search toggle */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        mt: 1
                    }}
                >
                    <Button
                        size="small"
                        color="inherit"
                        onClick={toggleAdvanced}
                        endIcon={
                            <ExpandMoreIcon
                                sx={{
                                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s'
                                }}
                            />
                        }
                        sx={{
                            textTransform: 'none',
                            color: theme.palette.text.secondary
                        }}
                    >
                        Advanced Search
                    </Button>
                </Box>

                {/* Advanced search options */}
                <Collapse in={expanded}>
                    <Paper
                        elevation={0}
                        sx={{
                            mt: 2,
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: theme.palette.divider
                        }}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    fullWidth
                                    label="Test ID"
                                    name="test_id"
                                    size="small"
                                    value={values.test_id || ''}
                                    onChange={changeHandler}
                                    variant="outlined"
                                    placeholder="E.g. T1234"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="category-label">Category</InputLabel>
                                    <Select
                                        labelId="category-label"
                                        id="category-select"
                                        name="category"
                                        value={values.category || ''}
                                        label="Category"
                                        onChange={changeHandler}
                                    >
                                        <MenuItem value="">All Categories</MenuItem>
                                        <MenuItem value="genetic">Genetic</MenuItem>
                                        <MenuItem value="biochemical">Biochemical</MenuItem>
                                        <MenuItem value="molecular">Molecular</MenuItem>
                                        <MenuItem value="pathology">Pathology</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="method-label">Method</InputLabel>
                                    <Select
                                        labelId="method-label"
                                        id="method-select"
                                        name="method"
                                        value={values.method || ''}
                                        label="Method"
                                        onChange={changeHandler}
                                    >
                                        <MenuItem value="">All Methods</MenuItem>
                                        <MenuItem value="ngs">NGS</MenuItem>
                                        <MenuItem value="pcr">PCR</MenuItem>
                                        <MenuItem value="sanger">Sanger Sequencing</MenuItem>
                                        <MenuItem value="fish">FISH</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="turnaround-label">Turnaround Time</InputLabel>
                                    <Select
                                        labelId="turnaround-label"
                                        id="turnaround-select"
                                        name="turnaround"
                                        value={values.turnaround || ''}
                                        label="Turnaround Time"
                                        onChange={changeHandler}
                                    >
                                        <MenuItem value="">Any Time</MenuItem>
                                        <MenuItem value="1-7">1-7 days</MenuItem>
                                        <MenuItem value="8-14">8-14 days</MenuItem>
                                        <MenuItem value="15-30">15-30 days</MenuItem>
                                        <MenuItem value="30+">30+ days</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    setValues({
                                        search: values.search,
                                        type: values.type
                                    });
                                }}
                                sx={{
                                    mr: 1,
                                    borderRadius: 1.5,
                                    textTransform: 'none'
                                }}
                            >
                                Clear Filters
                            </Button>

                            <Button
                                variant="contained"
                                size="small"
                                type="submit"
                                startIcon={<FilterIcon />}
                                sx={{
                                    borderRadius: 1.5,
                                    textTransform: 'none',
                                    boxShadow: 'none',
                                    '&:hover': {
                                        boxShadow: theme.shadows[2]
                                    }
                                }}
                            >
                                Apply Filters
                            </Button>
                        </Box>
                    </Paper>
                </Collapse>
            </Box>
        </motion.div>
    );
};

export default TestSearchForm;
