import React, { useState } from "react";
import {
    Box,
    Button,
    Chip,
    FormControl,
    FormControlLabel,
    FormHelperText,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Paper,
    Select,
    Switch,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import {
    AccessTime,
    Cancel,
    CheckCircle,
    Code,
    Description,
    Edit,
    Help,
    Info,
    Label,
    Save,
    Science,
    Wc
} from "@mui/icons-material";
import SelectSearch from "@/Components/SelectSearch";
import SampleTypeForm from "./SampleTypeForm";
import Gender from "@/Enums/Gender.js";

/**
 * Test Form component
 * Form for creating and editing diagnostic tests
 *
 * @param {Object} props Component props
 * @param {Object} props.values Form values
 * @param {Function} props.setValues Update values handler
 * @param {Function} props.cancel Cancel handler
 * @param {Function} props.submit Submit handler
 * @param {Object} props.errors Validation errors
 * @param {boolean} props.processing Loading state
 * @returns {JSX.Element} Rendered component
 */
const Form = ({
                  values,
                  setValues,
                  cancel,
                  submit,
                  errors = {},
                  processing = false
              }) => {
    // Track which sections are expanded
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        forms: true,
        samples: true,
        description: true
    });

    /**
     * Handle input change
     *
     * @param {Event} e Change event
     */
    const handleChange = (e) => {
        setValues(e.target.name, e.target.value);
    };

    /**
     * Handle switch toggle
     *
     * @param {Event} e Change event
     * @param {boolean} v New value
     */
    const handleSwitchChanged = (e, v) => {
        setValues(e.target.name, v);
    };

    /**
     * Handle select change
     *
     * @param {Event} e Change event
     */
    const handleSelectChange = (e) => {
        setValues(e.target.name, e.target.value);
    };

    /**
     * Toggle section expansion
     *
     * @param {string} section Section name
     */
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    /**
     * Check if a field has an error
     *
     * @param {string} field Field name
     * @returns {boolean} True if field has an error
     */
    const hasError = (field) => {
        return Object.keys(errors).includes(field);
    };

    /**
     * Get error message for a field
     *
     * @param {string} field Field name
     * @returns {string} Error message or empty string
     */
    const getErrorMessage = (field) => {
        return errors[field] || "";
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            {/* Basic Information Section */}
            <Paper
                variant="outlined"
                sx={{
                    p: 0,
                    mb: 3,
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >
                <Box
                    sx={{
                        p: 2,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                    }}
                    onClick={() => toggleSection('basic')}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Info />
                        <Typography variant="subtitle1" fontWeight="500">
                            Basic Information
                        </Typography>
                    </Box>

                    {expandedSections.basic ?
                        <CheckCircle fontSize="small" /> :
                        <Edit fontSize="small" />
                    }
                </Box>

                {expandedSections.basic && (
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={4}>
                                <TextField
                                    error={hasError('name')}
                                    helperText={getErrorMessage('name')}
                                    fullWidth
                                    label="Test Name"
                                    name="name"
                                    required
                                    value={values.name || ''}
                                    onChange={handleChange}
                                    disabled={processing}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Label color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    error={hasError('code')}
                                    helperText={getErrorMessage('code')}
                                    fullWidth
                                    label="Test Code"
                                    name="code"
                                    value={values.code || ''}
                                    onChange={handleChange}
                                    disabled={processing}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Code color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    error={hasError('shortName')}
                                    helperText={getErrorMessage('shortName')}
                                    fullWidth
                                    label="Short Name"
                                    required
                                    name="shortName"
                                    value={values.shortName || ''}
                                    onChange={handleChange}
                                    disabled={processing}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Label fontSize="small" color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={2}>
                                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={!!values.is_active}
                                                onChange={handleSwitchChanged}
                                                disabled={processing}
                                                color="success"
                                            />
                                        }
                                        labelPlacement="start"
                                        label={
                                            <Typography
                                                variant="body2"
                                                color={values.is_active ? 'success.main' : 'text.secondary'}
                                                fontWeight={500}
                                            >
                                                {values.is_active ? "Active" : "Inactive"}
                                            </Typography>
                                        }
                                        name="is_active"
                                        sx={{ ml: 0, mr: 0 }}
                                    />

                                    <Tooltip title="Active tests are available for ordering">
                                        <Help fontSize="small" color="action" sx={{ ml: 1 }} />
                                    </Tooltip>
                                </Box>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    error={hasError('turnaroundTime')}
                                    helperText={getErrorMessage('turnaroundTime') || "Number of days to process this test"}
                                    fullWidth
                                    required
                                    type="number"
                                    inputProps={{ min: 1 }}
                                    inputMode="numeric"
                                    label="Turnaround Time (days)"
                                    name="turnaroundTime"
                                    value={values.turnaroundTime || ''}
                                    onChange={handleChange}
                                    disabled={processing}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <AccessTime color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                                <FormControl
                                    fullWidth
                                    required
                                    error={hasError('gender')}
                                    disabled={processing}
                                >
                                    <InputLabel id="test-gender-label">Gender Applicability</InputLabel>
                                    <Select
                                        labelId="test-gender-label"
                                        id="test-gender"
                                        multiple
                                        name="gender"
                                        value={values.gender || []}
                                        onChange={handleSelectChange}
                                        input={
                                            <OutlinedInput
                                                label="Gender Applicability"
                                                startAdornment={
                                                    <InputAdornment position="start">
                                                        <Wc color="primary" />
                                                    </InputAdornment>
                                                }
                                            />
                                        }
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip
                                                        key={value}
                                                        label={Gender.get(value)}
                                                        size="small"
                                                        color={
                                                            value === "0" ? "secondary" :
                                                                value === "1" ? "primary" :
                                                                    "default"
                                                        }
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        <MenuItem value="0">Female</MenuItem>
                                        <MenuItem value="1">Male</MenuItem>
                                        <MenuItem value="-1">Unknown</MenuItem>
                                    </Select>

                                    {hasError('gender') ? (
                                        <FormHelperText error>{getErrorMessage('gender')}</FormHelperText>
                                    ) : (
                                        <FormHelperText>Select which genders this test is applicable to</FormHelperText>
                                    )}
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </Paper>

            {/* Required Forms Section */}
            <Paper
                variant="outlined"
                sx={{
                    p: 0,
                    mb: 3,
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >
                <Box
                    sx={{
                        p: 2,
                        bgcolor: 'secondary.main',
                        color: 'secondary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                    }}
                    onClick={() => toggleSection('forms')}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description />
                        <Typography variant="subtitle1" fontWeight="500">
                            Required Forms
                        </Typography>
                    </Box>

                    {expandedSections.forms ?
                        <CheckCircle fontSize="small" /> :
                        <Edit fontSize="small" />
                    }
                </Box>

                {expandedSections.forms && (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Select the forms that will be required for this test. These forms will need to be completed during the ordering process.
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={4}>
                                <SelectSearch
                                    name="consent"
                                    label="Consent Form"
                                    required
                                    value={values.consent}
                                    error={hasError('consent')}
                                    helperText={getErrorMessage('consent')}
                                    url={route("api.consents.list")}
                                    onchange={handleChange}
                                    disabled={processing}
                                    startIcon={<Description color="secondary" />}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                                <SelectSearch
                                    name="order_form"
                                    label="Order Form"
                                    required
                                    value={values.order_form}
                                    error={hasError('order_form')}
                                    helperText={getErrorMessage('order_form')}
                                    url={route("api.orderForms.list")}
                                    onchange={handleChange}
                                    disabled={processing}
                                    startIcon={<Description color="info" />}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                                <SelectSearch
                                    name="instruction"
                                    label="Instruction"
                                    required
                                    value={values.instruction}
                                    error={hasError('instruction')}
                                    helperText={getErrorMessage('instruction')}
                                    url={route("api.instructions.list")}
                                    onchange={handleChange}
                                    disabled={processing}
                                    startIcon={<Description color="warning" />}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </Paper>

            {/* Sample Types Section */}
            <Paper
                variant="outlined"
                sx={{
                    p: 0,
                    mb: 3,
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >
                <Box
                    sx={{
                        p: 2,
                        bgcolor: 'success.main',
                        color: 'success.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                    }}
                    onClick={() => toggleSection('samples')}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Science />
                        <Typography variant="subtitle1" fontWeight="500">
                            Sample Types
                        </Typography>
                    </Box>

                    {expandedSections.samples ?
                        <CheckCircle fontSize="small" /> :
                        <Edit fontSize="small" />
                    }
                </Box>

                {expandedSections.samples && (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Define which sample types are accepted for this test and specify the default type.
                        </Typography>

                        <SampleTypeForm
                            sampleTypes={values.sample_types}
                            error={errors.sample_types}
                            onChange={setValues}
                            disabled={processing}
                        />
                    </Box>
                )}
            </Paper>

            {/* Description Section */}
            <Paper
                variant="outlined"
                sx={{
                    p: 0,
                    mb: 4,
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >
                <Box
                    sx={{
                        p: 2,
                        bgcolor: 'info.main',
                        color: 'info.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                    }}
                    onClick={() => toggleSection('description')}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Info />
                        <Typography variant="subtitle1" fontWeight="500">
                            Description
                        </Typography>
                    </Box>

                    {expandedSections.description ?
                        <CheckCircle fontSize="small" /> :
                        <Edit fontSize="small" />
                    }
                </Box>

                {expandedSections.description && (
                    <Box sx={{ p: 3 }}>
                        <TextField
                            multiline
                            rows={5}
                            error={hasError('description')}
                            helperText={getErrorMessage('description') || "Provide detailed information about this test, including purpose, methodology, and any special requirements"}
                            fullWidth
                            label="Test Description"
                            name="description"
                            value={values.description || ''}
                            onChange={handleChange}
                            disabled={processing}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                                        <Description color="info" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                )}
            </Paper>

            {/* Form Actions */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 2,
                    mt: 3,
                    pt: 3,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Button
                    variant="outlined"
                    onClick={cancel}
                    startIcon={<Cancel />}
                    disabled={processing}
                >
                    Cancel
                </Button>

                <Button
                    variant="contained"
                    onClick={submit}
                    startIcon={<Save />}
                    disabled={processing}
                    color="primary"
                >
                    {processing ? "Saving..." : "Save Test"}
                </Button>
            </Box>
        </Box>
    );
};

export default Form;
