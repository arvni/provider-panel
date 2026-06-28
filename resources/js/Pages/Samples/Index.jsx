import React, { useMemo, useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Fade,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import {
    Assignment as AssignmentIcon,
    Biotech as BiotechIcon,
    Close as CloseIcon,
    LocalShipping as ShippingIcon,
    LocationOn as LocationIcon,
    Notes as NotesIcon,
    Person as PersonIcon,
} from "@mui/icons-material";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const patientName = (patient) => {
    if (!patient) return null;
    return patient.fullName || [patient.name, patient.family].filter(Boolean).join(" ");
};

const SamplesIndex = ({ orders = [] }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    // Selected sample ids across all orders.
    const [selected, setSelected] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        samples: [],
        preferred_date: "",
        note: "",
        address: "",
    });

    // Flat list of every selectable (un-sent) sample id, for "select all".
    const allSampleIds = useMemo(
        () => orders.flatMap((order) => (order.samples || []).map((s) => s.id)),
        [orders]
    );

    const totalSamples = allSampleIds.length;

    const toggleSample = (id) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
    };

    const toggleOrder = (order) => {
        const ids = (order.samples || []).map((s) => s.id);
        const allSelected = ids.every((id) => selected.includes(id));
        setSelected((prev) =>
            allSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]
        );
    };

    const toggleAll = () => {
        setSelected((prev) => (prev.length === totalSamples ? [] : [...allSampleIds]));
    };

    const handleOpenDialog = () => {
        if (selected.length === 0) return;
        setData("samples", selected);
        setDialogOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("samples.collect-request"), {
            preserveScroll: true,
            onSuccess: () => {
                setDialogOpen(false);
                setSelected([]);
                reset();
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Samples" />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                        Samples
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Samples not yet sent on a collect request, grouped by order. Select the
                        samples you want collected and create a request.
                    </Typography>
                </Box>

                {totalSamples > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                        <Button size="small" onClick={toggleAll}>
                            {selected.length === totalSamples ? "Deselect all" : "Select all"}
                        </Button>
                    </Box>
                )}

                {orders.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 6,
                            textAlign: "center",
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                        }}
                    >
                        <BiotechIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No samples awaiting collection
                        </Typography>
                    </Paper>
                ) : (
                    <Stack spacing={3}>
                        {orders.map((order) => {
                            const samples = order.samples || [];
                            const ids = samples.map((s) => s.id);
                            const selectedCount = ids.filter((id) => selected.includes(id)).length;
                            const allSelected = selectedCount > 0 && selectedCount === ids.length;

                            return (
                                <Card
                                    key={order.id}
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3,
                                        border: "1px solid",
                                        borderColor: "divider",
                                    }}
                                >
                                    <CardContent>
                                        {/* Order header */}
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: 1,
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                mb: 1,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1.5,
                                                }}
                                            >
                                                <FormControlLabel
                                                    sx={{ m: 0 }}
                                                    control={
                                                        <Checkbox
                                                            checked={allSelected}
                                                            indeterminate={
                                                                selectedCount > 0 && !allSelected
                                                            }
                                                            onChange={() => toggleOrder(order)}
                                                        />
                                                    }
                                                    label={
                                                        <Typography
                                                            variant="subtitle1"
                                                            sx={{ fontWeight: 700 }}
                                                        >
                                                            {order.orderId || `Order #${order.id}`}
                                                        </Typography>
                                                    }
                                                />
                                                {patientName(order.patient) && (
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 0.5,
                                                        }}
                                                    >
                                                        <PersonIcon
                                                            fontSize="small"
                                                            color="action"
                                                        />
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                        >
                                                            {patientName(order.patient)}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                            <Chip
                                                size="small"
                                                color={selectedCount > 0 ? "primary" : "default"}
                                                label={`${selectedCount}/${ids.length} selected`}
                                            />
                                        </Box>

                                        {order.tests && order.tests.length > 0 && (
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: 0.5,
                                                    mb: 1.5,
                                                }}
                                            >
                                                {order.tests.map((test) => (
                                                    <Chip
                                                        key={test.id}
                                                        size="small"
                                                        variant="outlined"
                                                        label={test.name}
                                                    />
                                                ))}
                                            </Box>
                                        )}

                                        <Divider sx={{ mb: 1 }} />

                                        {/* Sample list */}
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell padding="checkbox" />
                                                    <TableCell>Barcode</TableCell>
                                                    <TableCell>Sample type</TableCell>
                                                    <TableCell>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {samples.map((sample) => (
                                                    <TableRow
                                                        key={sample.id}
                                                        hover
                                                        onClick={() => toggleSample(sample.id)}
                                                        sx={{ cursor: "pointer" }}
                                                    >
                                                        <TableCell padding="checkbox">
                                                            <Checkbox
                                                                checked={selected.includes(
                                                                    sample.id
                                                                )}
                                                                onChange={() =>
                                                                    toggleSample(sample.id)
                                                                }
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ fontFamily: "monospace" }}>
                                                            {sample.sampleId || "—"}
                                                        </TableCell>
                                                        <TableCell>
                                                            {sample.sample_type?.name || "—"}
                                                        </TableCell>
                                                        <TableCell>
                                                            {sample.pooling ? (
                                                                <Chip
                                                                    size="small"
                                                                    color="info"
                                                                    label="Pooled"
                                                                />
                                                            ) : (
                                                                "—"
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Stack>
                )}

                {/* Floating create-request button */}
                {selected.length > 0 && (
                    <Fade in={selected.length > 0}>
                        <Box sx={{ position: "fixed", bottom: 32, right: 32, zIndex: 1000 }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<ShippingIcon />}
                                onClick={handleOpenDialog}
                                sx={{ borderRadius: 8, px: 4, py: 1.5, boxShadow: 4 }}
                            >
                                Create Collect Request ({selected.length})
                            </Button>
                        </Box>
                    </Fade>
                )}

                {/* Create-request dialog */}
                <Dialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                    fullScreen={isMobile}
                >
                    <DialogTitle>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Create Collect Request
                            </Typography>
                            <IconButton onClick={() => setDialogOpen(false)} size="small">
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={3} sx={{ mt: 1 }}>
                            <Alert severity="info" icon={<AssignmentIcon />}>
                                Requesting collection for {selected.length} sample(s).
                            </Alert>
                            {errors.samples && <Alert severity="error">{errors.samples}</Alert>}
                            <TextField
                                label="Preferred Collection Date"
                                type="datetime-local"
                                value={data.preferred_date}
                                onChange={(e) => setData("preferred_date", e.target.value)}
                                fullWidth
                                required
                                InputLabelProps={{ shrink: true }}
                                error={!!errors.preferred_date}
                                helperText={errors.preferred_date}
                            />
                            <TextField
                                label="Delivery Address"
                                value={data.address}
                                onChange={(e) => setData("address", e.target.value)}
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Enter collection address..."
                                error={!!errors.address}
                                helperText={errors.address}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LocationIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                label="Notes (Optional)"
                                value={data.note}
                                onChange={(e) => setData("note", e.target.value)}
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Any special instructions..."
                                error={!!errors.note}
                                helperText={errors.note}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <NotesIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setDialogOpen(false)} color="inherit">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={processing || !data.preferred_date}
                            startIcon={<ShippingIcon />}
                        >
                            Submit Request
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </AuthenticatedLayout>
    );
};

export default SamplesIndex;
