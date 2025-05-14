import React, { useEffect, useState } from "react";
import { useSubmitForm } from "@/Services/api";
import PatientDetailsForm from "../Components/PatientDetailsForm";
import EditLayout from "../EditLayout";
import { patientDetailsValidate } from "@/Services/validate";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Button,
    Box,
    Typography,
    InputAdornment,
    IconButton,
    Avatar,
    Chip,
    Tooltip,
    Paper,
    TableContainer,
    Divider,
    Alert,
    TablePagination,
    useTheme,
    alpha,
    Fade
} from "@mui/material";
import {
    Search as SearchIcon,
    Close as CloseIcon,
    PersonAdd as PersonAddIcon,
    PersonSearch as PersonSearchIcon,
    Flag as FlagIcon,
    Cake as CakeIcon,
    Badge as BadgeIcon,
    Clear as ClearIcon,
    Check as CheckIcon,
    Info as InfoIcon
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Enhanced PatientList component with improved search and selection
 */
const PatientList = ({ open, onClose, onSelect }) => {
    const theme = useTheme();
    const [patientList, setPatientList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch patients when dialog opens
    useEffect(() => {
        if (open) {
            fetch();
        }
    }, [open]);

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handle search submission
    const handleSearch = (e) => {
        e.preventDefault();
        fetch(searchTerm);
    };

    // Clear search
    const handleClearSearch = () => {
        setSearchTerm("");
        fetch("");
    };

    // Fetch patients from API
    const fetch = (search) => {
        setLoading(true);
        setSelectedPatient(null);

        axios.get(route("api.patients.list", { search }))
            .then(({ data }) => {
                setPatientList(data.data);
                // Reset pagination
                setPage(0);
            })
            .catch((error) => {
                console.error("Error fetching patients:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Handle row selection
    const handleSelect = (patient) => () => {
        setSelectedPatient(patient);
    };

    // Confirm selection
    const handleConfirmSelection = () => {
        if (selectedPatient) {
            setIsSubmitting(true);

            // Simulate loading state for better UX
            setTimeout(() => {
                onSelect(selectedPatient);
                setIsSubmitting(false);
            }, 500);
        }
    };

    // Handle pagination
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "—";

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

    // Calculate displayed rows
    const displayedRows = patientList
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Empty state
    const isEmptyList = patientList.length === 0 && !loading;

    return (
        <Dialog
            onClose={onClose}
            open={open}
            fullWidth
            maxWidth="md"
            PaperProps={{
                elevation: 5,
                sx: {
                    borderRadius: 2,
                    overflow: 'hidden'
                }
            }}
        >
            <DialogTitle
                sx={{
                    px: 3,
                    py: 2,
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonSearchIcon />
                    <Typography variant="h6" component="div">
                        Patient List
                    </Typography>
                </Box>

                <IconButton
                    edge="end"
                    color="inherit"
                    onClick={onClose}
                    aria-label="close"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {/* Search Bar */}
                <Box
                    component="form"
                    onSubmit={handleSearch}
                    sx={{
                        p: 2,
                        borderBottom: '1px solid',
                        borderColor: theme.palette.divider,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search by name, ID, or reference number"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        aria-label="clear search"
                                        onClick={handleClearSearch}
                                        edge="end"
                                    >
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: {
                                borderRadius: 1.5,
                            }
                        }}
                        sx={{ flexGrow: 1 }}
                    />

                    <Button
                        variant="contained"
                        type="submit"
                        startIcon={<SearchIcon />}
                        sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            boxShadow: 'none',
                            px: 2,
                            '&:hover': {
                                boxShadow: theme.shadows[2]
                            }
                        }}
                    >
                        Search
                    </Button>
                </Box>

                {/* Patient Table */}
                <TableContainer
                    sx={{
                        maxHeight: 400,
                        position: 'relative'
                    }}
                >
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Patient Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>ID Number</TableCell>
                                <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Reference ID</TableCell>
                                <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Date of Birth</TableCell>
                                <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Nationality</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading ? (
                                // Loading state
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                        <CircularProgress size={40} />
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                            Loading patients...
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : isEmptyList ? (
                                // Empty state
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 2
                                            }}
                                        >
                                            <PersonSearchIcon
                                                sx={{
                                                    fontSize: 48,
                                                    color: alpha(theme.palette.text.secondary, 0.5)
                                                }}
                                            />
                                            <Typography variant="h6" color="text.secondary">
                                                No patients found
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {searchTerm
                                                    ? `No results match "${searchTerm}". Try a different search term.`
                                                    : "There are no patients in the system yet."}
                                            </Typography>
                                            {searchTerm && (
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<ClearIcon />}
                                                    onClick={handleClearSearch}
                                                    sx={{
                                                        mt: 1,
                                                        borderRadius: 1.5,
                                                        textTransform: 'none'
                                                    }}
                                                >
                                                    Clear Search
                                                </Button>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                // Patient rows
                                displayedRows.map((patient) => (
                                    <TableRow
                                        key={patient.id}
                                        hover
                                        selected={selectedPatient?.id === patient.id}
                                        onClick={handleSelect(patient)}
                                        sx={{
                                            cursor: "pointer",
                                            '&.Mui-selected': {
                                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                            },
                                            '&.Mui-selected:hover': {
                                                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                            }
                                        }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        bgcolor: selectedPatient?.id === patient.id
                                                            ? theme.palette.primary.main
                                                            : theme.palette.grey[500],
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    {getInitials(patient?.fullName)}
                                                </Avatar>
                                                <Typography
                                                    fontWeight={selectedPatient?.id === patient.id ? 600 : 400}
                                                    color={selectedPatient?.id === patient.id ? 'primary.main' : 'text.primary'}
                                                >
                                                    {patient?.fullName || "—"}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{patient?.id_no || "—"}</TableCell>
                                        <TableCell>{patient?.reference_id || "—"}</TableCell>
                                        <TableCell>{formatDate(patient?.dateOfBirth)}</TableCell>
                                        <TableCell>
                                            {patient?.nationality?.label ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box
                                                        component="img"
                                                        alt=""
                                                        src={`https://flagcdn.com/w20/${patient.nationality.code.toLowerCase()}.png`}
                                                        sx={{ width: 20, height: 'auto' }}
                                                    />
                                                    {patient.nationality.label}
                                                </Box>
                                            ) : (
                                                "—"
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {patientList.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={patientList.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                )}
            </DialogContent>

            <DialogActions
                sx={{
                    p: 2,
                    borderTop: '1px solid',
                    borderColor: theme.palette.divider,
                    justifyContent: 'space-between'
                }}
            >
                {selectedPatient && (
                    <Alert
                        severity="info"
                        icon={<InfoIcon />}
                        sx={{
                            flexGrow: 1,
                            mr: 2,
                            '& .MuiAlert-icon': {
                                alignItems: 'center'
                            }
                        }}
                    >
                        <Typography variant="body2">
                            <strong>{selectedPatient.fullName}</strong> selected.
                        </Typography>
                    </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={onClose}
                        startIcon={<CloseIcon />}
                        sx={{
                            borderRadius: 1.5,
                            textTransform: 'none'
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
                        onClick={handleConfirmSelection}
                        disabled={!selectedPatient || isSubmitting}
                        sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            boxShadow: 'none',
                            '&:hover': {
                                boxShadow: theme.shadows[2]
                            }
                        }}
                    >
                        {isSubmitting ? 'Loading...' : 'Use Selected Patient'}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

/**
 * Enhanced PatientDetails component with improved layout and user experience
 */
const PatientDetails = ({ auth, order, step, genders }) => {
    const theme = useTheme();

    // Form state management
    const {
        data,
        setData,
        submit,
        errors,
        setError,
        clearErrors,
        processing
    } = useSubmitForm(
        { ...order.patient, _method: "put" },
        route("orders.update", { order: order.id, step })
    );

    const [openPatientList, setOpenPatientList] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Handle field changes
    const handleChange = (key, value) => {
        setData(previousData => ({ ...previousData, [key]: value }));

        // Clear error for this field
        if (errors[key]) {
            clearErrors(key);
        }

        // Hide success message when form changes
        if (showSuccess) {
            setShowSuccess(false);
        }
    };

    // Submit form with validation
    const handleSubmit = () => {
        clearErrors();

        if (patientDetailsValidate(data, setError)) {
            submit({
                onSuccess: () => {
                    // Show success message
                    setShowSuccess(true);

                    // Auto-hide success message after 3 seconds
                    setTimeout(() => {
                        setShowSuccess(false);
                    }, 3000);
                }
            });
        }
    };

    // Patient list dialog handlers
    const handlePatientListOpen = () => {
        setOpenPatientList(true);
    };

    const handlePatientListClose = () => {
        setOpenPatientList(false);
    };

    // Handle patient selection from list
    const handlePatientSelect = (patient) => {
        setData({ ...patient, _method: "put" });
        handlePatientListClose();

        // Show success message
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
        }, 3000);
    };

    return (
        <EditLayout
            step={step}
            auth={auth}
            id={order.id}
            onSubmit={handleSubmit}
            isSubmitting={processing}
        >
            {/* Success message */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Alert
                            severity="success"
                            sx={{
                                mb: 3,
                                borderRadius: 2,
                                '& .MuiAlert-icon': {
                                    alignItems: 'center'
                                }
                            }}
                            onClose={() => setShowSuccess(false)}
                        >
                            Patient information saved successfully.
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Patient details form */}
            <PatientDetailsForm
                patient={data}
                genders={genders}
                onChange={handleChange}
                onSubmit={handleSubmit}
                errors={errors}
                handlePatientListOpen={handlePatientListOpen}
            />

            {/* Patient list dialog */}
            <PatientList
                open={openPatientList}
                onClose={handlePatientListClose}
                onSelect={handlePatientSelect}
            />
        </EditLayout>
    );
};

export default PatientDetails;
