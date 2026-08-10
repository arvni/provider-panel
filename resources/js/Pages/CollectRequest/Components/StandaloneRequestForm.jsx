import React, { useMemo, useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    Alert,
    alpha,
    Avatar,
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import {
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon,
    Event as EventIcon,
    LocalShipping as ShippingIcon,
    Notes as NotesIcon,
    Science as ScienceIcon,
    Search as SearchIcon,
} from "@mui/icons-material";

const COMMENT_MAX_LENGTH = 1000;

// A search box only earns its place once the list stops fitting at a glance.
const SEARCH_THRESHOLD = 8;

/** Local-time YYYY-MM-DD, the format the date input speaks. */
const toInputDate = (date) =>
    [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");

const addDays = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return toInputDate(date);
};

/** Read a YYYY-MM-DD value back as a local date, so the day never shifts. */
const formatInputDate = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
};

/**
 * A sample type rendered as a tappable card. It is a real checkbox inside a
 * label, so the whole card is clickable and it stays keyboard accessible.
 */
const SampleTypeCard = ({ sampleType, checked, onChange }) => (
    <Paper
        component="label"
        variant="outlined"
        sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 1,
            height: "100%",
            cursor: "pointer",
            borderRadius: 2,
            borderColor: checked ? "primary.main" : "divider",
            bgcolor: (theme) =>
                checked ? alpha(theme.palette.primary.main, 0.08) : "background.paper",
            transition: "border-color .15s, background-color .15s",
            "&:hover": {
                borderColor: "primary.main",
            },
        }}
    >
        <Checkbox
            checked={checked}
            onChange={onChange}
            size="small"
            sx={{ p: 0.5 }}
            slotProps={{ input: { "aria-label": sampleType.name } }}
        />
        <Typography variant="body2" sx={{ fontWeight: checked ? 600 : 400, lineHeight: 1.3 }}>
            {sampleType.name}
        </Typography>
    </Paper>
);

/** A numbered section heading, so the three things being asked for are obvious. */
const Section = ({ step, title, hint, action, children }) => (
    <Box>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
            <Avatar
                sx={{
                    width: 24,
                    height: 24,
                    fontSize: 13,
                    fontWeight: 700,
                    bgcolor: "primary.main",
                }}
            >
                {step}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {title}
                </Typography>
                {hint && (
                    <Typography variant="caption" color="text.secondary">
                        {hint}
                    </Typography>
                )}
            </Box>
            {action}
        </Stack>
        {children}
    </Box>
);

/**
 * Dialog for requesting a collection without an order: the provider picks the
 * sample types they have ready, a preferred date and an optional comment.
 */
const StandaloneRequestForm = ({ open, onClose, sampleTypes = [] }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [search, setSearch] = useState("");

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        sample_types: [],
        preferred_date: "",
        comment: "",
    });

    const selectedCount = data.sample_types.length;

    const visibleSampleTypes = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return sampleTypes;

        return sampleTypes.filter((sampleType) => sampleType.name.toLowerCase().includes(term));
    }, [sampleTypes, search]);

    const toggleSampleType = (id) => () => {
        setData(
            "sample_types",
            data.sample_types.includes(id)
                ? data.sample_types.filter((item) => item !== id)
                : [...data.sample_types, id]
        );
    };

    const handleClose = () => {
        reset();
        clearErrors();
        setSearch("");
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("collectRequests.store"), {
            preserveScroll: true,
            onSuccess: handleClose,
        });
    };

    // The date input must not offer a day in the past (validated server side too).
    const today = toInputDate(new Date());

    const datePresets = [
        { label: "Today", value: today },
        { label: "Tomorrow", value: addDays(1) },
        { label: "In 3 days", value: addDays(3) },
        { label: "Next week", value: addDays(7) },
    ];

    const canSubmit = selectedCount > 0 && !!data.preferred_date && !processing;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
            slotProps={{ paper: { component: "form", onSubmit: handleSubmit } }}
        >
            <DialogTitle sx={{ pb: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                        <ShippingIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            New Collection Request
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            For samples you already have — no order needed.
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose} size="small" aria-label="Close">
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <Divider />

            {/* Two columns from md up: the sample types (the long part) on the
                left, the date and comment on the right, so the whole form is
                visible at once instead of scrolling. */}
            <DialogContent sx={{ pt: 3 }}>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Section
                            step="1"
                            title="Which samples do you have?"
                            hint="Select every type waiting for pickup."
                            action={
                                selectedCount > 0 && (
                                    <Chip
                                        size="small"
                                        color="primary"
                                        icon={<CheckCircleIcon />}
                                        label={`${selectedCount} selected`}
                                        onDelete={() => setData("sample_types", [])}
                                    />
                                )
                            }
                        >
                            {sampleTypes.length === 0 ? (
                                <Alert severity="warning">
                                    No sample types are available yet. Please contact the
                                    laboratory.
                                </Alert>
                            ) : (
                                <Stack spacing={1.5}>
                                    {sampleTypes.length > SEARCH_THRESHOLD && (
                                        <TextField
                                            size="small"
                                            placeholder="Search sample types…"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            fullWidth
                                            slotProps={{
                                                input: {
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <SearchIcon fontSize="small" />
                                                        </InputAdornment>
                                                    ),
                                                },
                                            }}
                                        />
                                    )}

                                    {visibleSampleTypes.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            No sample type matches “{search}”.
                                        </Typography>
                                    ) : (
                                        // A very long list scrolls on its own rather
                                        // than pushing the rest of the form off screen.
                                        <Box sx={{ maxHeight: 360, overflowY: "auto", pr: 0.5 }}>
                                            <Grid container spacing={1}>
                                                {visibleSampleTypes.map((sampleType) => (
                                                    <Grid
                                                        size={{ xs: 12, sm: 6 }}
                                                        key={sampleType.id}
                                                    >
                                                        <SampleTypeCard
                                                            sampleType={sampleType}
                                                            checked={data.sample_types.includes(
                                                                sampleType.id
                                                            )}
                                                            onChange={toggleSampleType(
                                                                sampleType.id
                                                            )}
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Box>
                                    )}
                                </Stack>
                            )}

                            {errors.sample_types && (
                                <Alert severity="error" sx={{ mt: 1.5 }}>
                                    {errors.sample_types}
                                </Alert>
                            )}
                        </Section>
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                        <Stack spacing={3.5}>
                            <Section
                                step="2"
                                title="When should we collect them?"
                                hint="Pick a day that suits you — we confirm the exact time."
                            >
                                <Stack spacing={1.5}>
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        {datePresets.map((preset) => (
                                            <Chip
                                                key={preset.label}
                                                label={preset.label}
                                                size="small"
                                                variant={
                                                    data.preferred_date === preset.value
                                                        ? "filled"
                                                        : "outlined"
                                                }
                                                color={
                                                    data.preferred_date === preset.value
                                                        ? "primary"
                                                        : "default"
                                                }
                                                onClick={() =>
                                                    setData("preferred_date", preset.value)
                                                }
                                            />
                                        ))}
                                    </Stack>
                                    <TextField
                                        label="Preferred date"
                                        type="date"
                                        value={data.preferred_date}
                                        onChange={(e) => setData("preferred_date", e.target.value)}
                                        fullWidth
                                        required
                                        slotProps={{
                                            inputLabel: { shrink: true },
                                            htmlInput: { min: today },
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <EventIcon
                                                            color="action"
                                                            fontSize="small"
                                                        />
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                        error={!!errors.preferred_date}
                                        helperText={errors.preferred_date}
                                    />
                                </Stack>
                            </Section>

                            <Section step="3" title="Anything we should know?" hint="Optional.">
                                <TextField
                                    label="Comment"
                                    value={data.comment}
                                    onChange={(e) => setData("comment", e.target.value)}
                                    fullWidth
                                    multiline
                                    rows={4}
                                    placeholder="Number of tubes, storage conditions, who to ask for…"
                                    error={!!errors.comment}
                                    helperText={
                                        errors.comment ??
                                        `${data.comment.length}/${COMMENT_MAX_LENGTH} characters`
                                    }
                                    slotProps={{
                                        htmlInput: { maxLength: COMMENT_MAX_LENGTH },
                                        input: {
                                            startAdornment: (
                                                <InputAdornment
                                                    position="start"
                                                    sx={{ alignSelf: "start", mt: 2 }}
                                                >
                                                    <NotesIcon color="action" fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            </Section>
                        </Stack>
                    </Grid>
                </Grid>
            </DialogContent>

            <Divider />
            <DialogActions sx={{ px: 3, py: 2 }}>
                {/* Recap of what is about to be sent, so the button is never a leap of faith. */}
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ flexGrow: 1, minWidth: 0 }}
                >
                    <ScienceIcon fontSize="small" color={selectedCount ? "primary" : "disabled"} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {selectedCount === 0
                            ? "Select at least one sample type"
                            : `${selectedCount} sample type${selectedCount > 1 ? "s" : ""}${
                                  data.preferred_date
                                      ? ` · ${formatInputDate(data.preferred_date)}`
                                      : ""
                              }`}
                    </Typography>
                </Stack>
                <Button onClick={handleClose} color="inherit" disabled={processing}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={!canSubmit}
                    startIcon={<ShippingIcon />}
                >
                    {processing ? "Sending…" : "Submit Request"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StandaloneRequestForm;
