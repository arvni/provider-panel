import React, { useState } from "react";
import {
    Box,
    Button,
    Chip,
    Divider,
    FormHelperText,
    Grid,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
    alpha
} from "@mui/material";
import {
    AttachFile,
    Delete,
    Description,
    RemoveRedEye,
    Save,
    Cancel,
    CheckBox,
    TextFields,
    FormatListNumbered
} from "@mui/icons-material";
import RequirementForm from "@/Pages/OrderForm/Components/RequirementForm";

/**
 * Order Form component
 * Used for creating and editing order forms
 *
 * @param {Object} props Component props
 * @param {Object} props.values Form values
 * @param {Function} props.setValues Update form values
 * @param {Function} props.cancel Cancel handler
 * @param {Function} props.submit Submit handler
 * @param {Object} props.errors Validation errors
 * @param {boolean} props.edit Whether this is an edit form
 * @param {boolean} props.processing Whether form is processing
 * @returns {JSX.Element} Rendered component
 */
const Form = ({
                  values,
                  setValues,
                  cancel,
                  submit,
                  errors = {},
                  edit = false,
                  processing = false
              }) => {
    // State for file upload
    const [fileError, setFileError] = useState('');
    const [fileName, setFileName] = useState('');

    /**
     * Handle input change
     *
     * @param {Event} e Change event
     */
    const handleChange = (e) => {
        setValues(prevValues => ({
            ...prevValues,
            [e.target.name]: e.target.value
        }));
    };

    /**
     * Handle file upload
     *
     * @param {Event} e Change event
     */
    const handleFileChange = (e) => {
        const file = e.target.files[0];

        // Validate file
        if (file) {
            // Check file type
            const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!validTypes.includes(file.type)) {
                setFileError('Please upload a PDF or Word document');
                return;
            }

            // Check file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                setFileError('File size should not exceed 5MB');
                return;
            }

            setFileName(file.name);
            setFileError('');
            setValues(prevState => ({
                ...prevState,
                [e.target.name]: file
            }));
        }
    };

    /**
     * Clear file selection
     */
    const clearFile = () => {
        setValues(prevState => ({
            ...prevState,
            file: null
        }));
        setFileName('');
        setFileError('');
    };

    /**
     * Update form data fields
     *
     * @param {Array} formData Updated form data
     */
    const handleFormDataChanged = (formData) => {
        setValues(prevState => ({
            ...prevState,
            formData
        }));
    };

    /**
     * Get field type icon
     *
     * @param {string} type Field type
     * @returns {JSX.Element} Icon component
     */
    const getFieldTypeIcon = (type) => {
        switch (type) {
            case 'text':
                return <TextFields fontSize="small" color="primary" />;
            case 'checkbox':
                return <CheckBox fontSize="small" color="secondary" />;
            case 'number':
                return <FormatListNumbered fontSize="small" color="success" />;
            default:
                return <TextFields fontSize="small" color="primary" />;
        }
    };

    return (
        <Grid container spacing={3}>
            {/* Basic Information Section */}
            <Grid item xs={12}>
                <Paper
                    variant="outlined"
                    sx={{
                        p: 3,
                        mb: 2,
                        borderRadius: 2
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        Basic Information
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Form Name"
                                name="name"
                                value={values.name || ''}
                                onChange={handleChange}
                                error={!!errors.name}
                                helperText={errors.name || "Enter a descriptive name for this form"}
                                required
                                disabled={processing}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Description color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                    gutterBottom
                                >
                                    Form Template File (PDF or Word)
                                </Typography>

                                {/* Show existing file if present */}
                                {typeof values.file === "string" && values.file ? (
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            mb: 2,
                                            borderColor: 'primary.main',
                                            bgcolor: alpha('#fff', 0.7)
                                        }}
                                    >
                                        <Stack
                                            direction="row"
                                            spacing={2}
                                            alignItems="center"
                                            justifyContent="space-between"
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Description color="primary" />
                                                <Typography variant="body2" noWrap>
                                                    Current file
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Tooltip title="View File">
                                                    <IconButton
                                                        href={route("file", { id: values.id, type: "orderForm" })}
                                                        target="_blank"
                                                        size="small"
                                                        color="primary"
                                                    >
                                                        <RemoveRedEye fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                ) : null}

                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<AttachFile />}
                                    sx={{ mb: 1 }}
                                    disabled={processing}
                                >
                                    {edit ? "Replace File" : "Upload File"}
                                    <input
                                        type="file"
                                        name="file"
                                        onChange={handleFileChange}
                                        hidden
                                        accept=".pdf,.doc,.docx"
                                    />
                                </Button>

                                {fileName && (
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            mb: 1,
                                            borderColor: 'primary.light',
                                            bgcolor: alpha('#fff', 0.7)
                                        }}
                                    >
                                        <Stack
                                            direction="row"
                                            spacing={2}
                                            alignItems="center"
                                            justifyContent="space-between"
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Description color="primary" />
                                                <Typography variant="body2" noWrap>
                                                    {fileName}
                                                </Typography>
                                            </Box>

                                            <Tooltip title="Remove">
                                                <IconButton
                                                    onClick={clearFile}
                                                    size="small"
                                                    color="error"
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Paper>
                                )}

                                {fileError && (
                                    <FormHelperText error>
                                        {fileError}
                                    </FormHelperText>
                                )}

                                <FormHelperText>
                                    Upload a PDF or Word document template for this form (max 5MB)
                                </FormHelperText>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>

            {/* Form Fields Section */}
            <Grid item xs={12}>
                <Paper
                    variant="outlined"
                    sx={{
                        p: 3,
                        mb: 2,
                        borderRadius: 2
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Form Fields
                        </Typography>

                        <Chip
                            label={`${values.formData.length} ${values.formData.length === 1 ? 'field' : 'fields'}`}
                            color="primary"
                            variant="outlined"
                            size="small"
                        />
                    </Box>

                    <Typography variant="body2" color="text.secondary" paragraph>
                        Add fields that will be included in this form. Drag to reorder fields.
                    </Typography>

                    {/* Form fields component */}
                    <RequirementForm
                        onChange={handleFormDataChanged}
                        requirements={values.formData}
                        error={errors}
                        disabled={processing}
                    />

                    {/* Preview of form fields */}
                    {values.formData.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Field Preview
                            </Typography>

                            <Paper variant="outlined" sx={{ mt: 1 }}>
                                <List disablePadding>
                                    {values.formData.map((field, index) => (
                                        <React.Fragment key={`field-${index}`}>
                                            {index > 0 && <Divider component="li" />}
                                            <ListItem>
                                                <ListItemIcon>
                                                    {getFieldTypeIcon(field.type)}
                                                </ListItemIcon>

                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {field.label}
                                                            {field.required && (
                                                                <Typography
                                                                    component="span"
                                                                    color="error.main"
                                                                    sx={{ ml: 0.5 }}
                                                                >
                                                                    *
                                                                </Typography>
                                                            )}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Typography variant="caption" color="text.secondary">
                                                            {field.type.charAt(0).toUpperCase() + field.type.slice(1)} field
                                                            {field.placeholder && ` • Placeholder: "${field.placeholder}"`}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                        </React.Fragment>
                                    ))}
                                </List>
                            </Paper>
                        </Box>
                    )}
                </Paper>
            </Grid>

            {/* Form Actions */}
            <Grid item xs={12}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 2,
                        mt: 2,
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
                        {processing ? 'Saving...' : edit ? 'Update Form' : 'Create Form'}
                    </Button>
                </Box>
            </Grid>
        </Grid>
    );
};

export default Form;
