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
    Radio,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import {
    Add as AddIcon,
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon,
    Event as EventIcon,
    Inventory2 as KitIcon,
    LocalShipping as ShippingIcon,
    Notes as NotesIcon,
    Remove as RemoveIcon,
    Science as ScienceIcon,
    Search as SearchIcon,
} from "@mui/icons-material";

const COMMENT_MAX_LENGTH = 1000;

// A search box only earns its place once the list stops fitting at a glance.
const SEARCH_THRESHOLD = 8;

// Mirrors StoreStandaloneCollectRequestRequest::MAX_KIT_AMOUNT.
const MAX_KIT_AMOUNT = 100;

// The two things a provider can ask for. Nothing is preselected: the choice
// decides what the rest of the form asks, so it has to be made deliberately.
const COLLECT = "collect";
const ORDER = "order";

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

/** Shared shell for every selectable card, so the two lists read as one family. */
const cardSx = (checked) => ({
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 1,
    height: "100%",
    borderRadius: 2,
    borderColor: checked ? "primary.main" : "divider",
    bgcolor: (theme) => (checked ? alpha(theme.palette.primary.main, 0.08) : "background.paper"),
    transition: "border-color .15s, background-color .15s",
    "&:hover": { borderColor: "primary.main" },
});

/**
 * The opening question, as two cards rather than a dropdown: each one says what
 * it means, so the fork is readable before it is taken.
 */
const ModeCard = ({ icon, title, hint, checked, onSelect }) => (
    <Paper
        component="label"
        variant="outlined"
        sx={{
            ...cardSx(checked),
            // The radio always sits beside the wording, never above it.
            flexWrap: "nowrap",
            alignItems: "flex-start",
            p: 2,
            cursor: "pointer",
        }}
    >
        <Radio
            checked={checked}
            onChange={onSelect}
            size="small"
            sx={{ p: 0.5 }}
            slotProps={{ input: { "aria-label": title } }}
        />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
                {icon}
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                    {title}
                </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
                {hint}
            </Typography>
        </Box>
    </Paper>
);

/**
 * A kit rendered as a tappable card. The label wraps only the checkbox and the
 * name, so the quantity stepper next to it can be clicked without un-picking
 * the kit; the card stays keyboard accessible either way.
 */
const KitCard = ({ label, checked, onSelect, quantity }) => (
    <Paper
        variant="outlined"
        sx={{
            ...cardSx(checked),
            // The stepper drops onto its own line rather than squeezing the kit
            // name into an ellipsis when the card is too narrow for both.
            pr: quantity && checked ? 1 : 1.5,
            pb: quantity && checked ? 1 : 0,
        }}
    >
        <Box
            component="label"
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexGrow: 1,
                minWidth: 0,
                px: 1.5,
                py: 1,
                cursor: "pointer",
            }}
        >
            <Checkbox
                checked={checked}
                onChange={onSelect}
                size="small"
                sx={{ p: 0.5 }}
                slotProps={{ input: { "aria-label": label } }}
            />
            <Typography variant="body2" sx={{ fontWeight: checked ? 600 : 400, lineHeight: 1.3 }}>
                {label}
            </Typography>
        </Box>
        {checked && quantity}
    </Paper>
);

/**
 * A collectable sample type. Several can be waiting for the same pickup, so
 * this one is a checkbox: the whole card is a label and stays keyboard
 * accessible.
 */
const SampleTypeCard = ({ label, checked, onChange }) => (
    <Paper
        component="label"
        variant="outlined"
        sx={{ ...cardSx(checked), px: 1.5, py: 1, cursor: "pointer" }}
    >
        <Checkbox
            checked={checked}
            onChange={onChange}
            size="small"
            sx={{ p: 0.5 }}
            slotProps={{ input: { "aria-label": label } }}
        />
        <Typography variant="body2" sx={{ fontWeight: checked ? 600 : 400, lineHeight: 1.3 }}>
            {label}
        </Typography>
    </Paper>
);

/**
 * The "how many" control, shown only on a chosen kit so the question is asked
 * once per kit and right where the answer belongs.
 */
const QuantityStepper = ({ value, onChange, disabled }) => {
    const step = (delta) => () => onChange(Math.min(MAX_KIT_AMOUNT, Math.max(1, value + delta)));

    return (
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
            <IconButton
                size="small"
                onClick={step(-1)}
                disabled={disabled || value <= 1}
                aria-label="One fewer kit"
            >
                <RemoveIcon fontSize="small" />
            </IconButton>
            <TextField
                value={value}
                onChange={(e) => {
                    const next = parseInt(e.target.value, 10);
                    onChange(Number.isNaN(next) ? 1 : Math.min(MAX_KIT_AMOUNT, Math.max(1, next)));
                }}
                size="small"
                type="number"
                disabled={disabled}
                slotProps={{
                    htmlInput: {
                        min: 1,
                        max: MAX_KIT_AMOUNT,
                        "aria-label": "Number of kits",
                        style: { textAlign: "center", padding: "4px 0", width: 40 },
                    },
                }}
            />
            <IconButton
                size="small"
                onClick={step(1)}
                disabled={disabled || value >= MAX_KIT_AMOUNT}
                aria-label="One more kit"
            >
                <AddIcon fontSize="small" />
            </IconButton>
        </Stack>
    );
};

/** A numbered section heading, so the things being asked for are obvious. */
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
 * Dialog for a logistic request raised without an order. The provider first
 * says what they need — a pickup for samples they already have, or kits sent
 * out to them — and only the matching list is then shown.
 */
const StandaloneRequestForm = ({
    open,
    onClose,
    sampleTypes = [],
    collectableSampleTypes = [],
    canRequestKit = true,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [search, setSearch] = useState("");

    // Without the kit permission there is no fork left to take, so the request
    // is a collection and the question is never asked.
    const initial = {
        mode: canRequestKit ? "" : COLLECT,
        // Each entry is one kit with its own quantity, so several types can be
        // asked for on the same request.
        kits: [],
        sample_types: [],
        preferred_date: "",
        comment: "",
    };

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm(initial);

    const isOrder = data.mode === ORDER;
    const choices = isOrder ? sampleTypes : collectableSampleTypes;

    // Quantities are looked up by sample type rather than by position, so the
    // cards stay independent of the order they were ticked in.
    const kitAmounts = useMemo(
        () => new Map(data.kits.map((kit) => [kit.sample_type, kit.amount])),
        [data.kits]
    );
    const kitCount = data.kits.length;
    const selectedCount = data.sample_types.length;

    // Named for the summary chip, which spells the kit out while there is only
    // one of them and falls back to counting once there are more.
    const soleKit = useMemo(
        () =>
            kitCount === 1
                ? (sampleTypes.find((sampleType) => sampleType.id === data.kits[0].sample_type) ??
                  null)
                : null,
        [sampleTypes, data.kits, kitCount]
    );

    // Every kit field validates under its own index, so any of them standing in
    // for the group is more use than showing none of them.
    const kitError =
        errors.kits ?? Object.entries(errors).find(([key]) => key.startsWith("kits."))?.[1];

    const visibleChoices = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return choices;

        return choices.filter((sampleType) => sampleType.name.toLowerCase().includes(term));
    }, [choices, search]);

    // Switching what you are asking for clears the other branch's answer, so a
    // half-filled question can never be submitted from behind the scenes.
    const selectMode = (mode) => () => setData({ ...data, mode, kits: [], sample_types: [] });

    // Un-ticking a kit drops its quantity with it, so a number left over from a
    // kit the provider changed their mind about is never submitted.
    const toggleKit = (id) => () =>
        setData(
            "kits",
            kitAmounts.has(id)
                ? data.kits.filter((kit) => kit.sample_type !== id)
                : [...data.kits, { sample_type: id, amount: 1 }]
        );

    const setKitAmount = (id) => (amount) =>
        setData(
            "kits",
            data.kits.map((kit) => (kit.sample_type === id ? { ...kit, amount } : kit))
        );

    const toggleSampleType = (id) => () =>
        setData(
            "sample_types",
            data.sample_types.includes(id)
                ? data.sample_types.filter((item) => item !== id)
                : [...data.sample_types, id]
        );

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

    const hasChoice = isOrder ? kitCount > 0 : selectedCount > 0;
    const canSubmit = !!data.mode && hasChoice && !!data.preferred_date && !processing;

    // The mode question only exists for providers allowed to order materials;
    // without it the remaining steps move up rather than starting at two.
    const stepOffset = canRequestKit ? 1 : 0;

    const summary = () => {
        if (!data.mode) return "Tell us what you need";
        if (isOrder && kitCount === 0) return "Choose at least one kit";
        if (!isOrder && selectedCount === 0) return "Select at least one sample type";
        if (!data.preferred_date) return "Pick a collection date";

        const kits = soleKit
            ? `${data.kits[0].amount} × ${soleKit.name} kit`
            : `${kitCount} kit types`;
        const what = isOrder ? kits : `${selectedCount} sample type${selectedCount > 1 ? "s" : ""}`;

        return `${isOrder ? "Delivery" : "Pickup"} ${formatInputDate(data.preferred_date)} · ${what}`;
    };

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
                            New Logistic Request
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            For samples you have, or kits you need — no order required.
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose} size="small" aria-label="Close">
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <Divider />

            {/* Two columns from md up: what is being asked for (the long part)
                on the left, the date and comment on the right, so the whole form
                is visible at once instead of scrolling. */}
            <DialogContent sx={{ pt: 3 }}>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Stack spacing={3.5}>
                            {canRequestKit && (
                                <Section step="1" title="What do you need?">
                                    <Grid container spacing={1} role="radiogroup" aria-label="Need">
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <ModeCard
                                                icon={
                                                    <ShippingIcon fontSize="small" color="action" />
                                                }
                                                title="Collect my samples"
                                                hint="Samples are ready for pickup."
                                                checked={data.mode === COLLECT}
                                                onSelect={selectMode(COLLECT)}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <ModeCard
                                                icon={<KitIcon fontSize="small" color="action" />}
                                                title="Order kits"
                                                hint="Send me sampling materials."
                                                checked={isOrder}
                                                onSelect={selectMode(ORDER)}
                                            />
                                        </Grid>
                                    </Grid>

                                    {errors.mode && (
                                        <Alert severity="error" sx={{ mt: 1.5 }}>
                                            {errors.mode}
                                        </Alert>
                                    )}
                                </Section>
                            )}

                            {/* Step two keeps its place before the fork is taken,
                                so the numbering never skips a beat. */}
                            {!data.mode ? (
                                <Section step="2" title="Then pick what you need">
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 2,
                                            borderStyle: "dashed",
                                            p: 3,
                                            textAlign: "center",
                                        }}
                                    >
                                        <Typography variant="body2" color="text.secondary">
                                            Choose an option above and the list appears here.
                                        </Typography>
                                    </Paper>
                                </Section>
                            ) : (
                                <Section
                                    step={`${stepOffset + 1}`}
                                    title={
                                        isOrder
                                            ? "Which kits do you want?"
                                            : "Which samples do you have?"
                                    }
                                    hint={
                                        isOrder
                                            ? "Select every kit you need, with how many of each."
                                            : "Select every type waiting for pickup."
                                    }
                                    action={
                                        isOrder
                                            ? kitCount > 0 && (
                                                  <Chip
                                                      size="small"
                                                      color="primary"
                                                      icon={<KitIcon />}
                                                      label={
                                                          soleKit
                                                              ? `${data.kits[0].amount} × ${soleKit.name}`
                                                              : `${kitCount} kits selected`
                                                      }
                                                      onDelete={() => setData("kits", [])}
                                                  />
                                              )
                                            : selectedCount > 0 && (
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
                                    {choices.length === 0 ? (
                                        <Alert severity="warning">
                                            {isOrder
                                                ? "No kits are available yet. Please contact the laboratory."
                                                : "No sample types are collectable yet. Please contact the laboratory."}
                                        </Alert>
                                    ) : (
                                        <Stack spacing={1.5}>
                                            {choices.length > SEARCH_THRESHOLD && (
                                                <TextField
                                                    size="small"
                                                    placeholder={
                                                        isOrder
                                                            ? "Search kits…"
                                                            : "Search sample types…"
                                                    }
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

                                            {visibleChoices.length === 0 ? (
                                                <Typography variant="body2" color="text.secondary">
                                                    Nothing matches “{search}”.
                                                </Typography>
                                            ) : (
                                                // A very long list scrolls on its own rather
                                                // than pushing the rest of the form off screen.
                                                <Box
                                                    sx={{
                                                        maxHeight: 320,
                                                        overflowY: "auto",
                                                        pr: 0.5,
                                                    }}
                                                >
                                                    <Grid container spacing={1}>
                                                        {visibleChoices.map((sampleType) =>
                                                            isOrder ? (
                                                                <Grid
                                                                    size={{ xs: 12, sm: 6 }}
                                                                    key={sampleType.id}
                                                                >
                                                                    <KitCard
                                                                        label={sampleType.name}
                                                                        checked={kitAmounts.has(
                                                                            sampleType.id
                                                                        )}
                                                                        onSelect={toggleKit(
                                                                            sampleType.id
                                                                        )}
                                                                        quantity={
                                                                            <QuantityStepper
                                                                                value={
                                                                                    kitAmounts.get(
                                                                                        sampleType.id
                                                                                    ) ?? 1
                                                                                }
                                                                                onChange={setKitAmount(
                                                                                    sampleType.id
                                                                                )}
                                                                                disabled={
                                                                                    processing
                                                                                }
                                                                            />
                                                                        }
                                                                    />
                                                                </Grid>
                                                            ) : (
                                                                <Grid
                                                                    size={{ xs: 12, sm: 6 }}
                                                                    key={sampleType.id}
                                                                >
                                                                    <SampleTypeCard
                                                                        label={sampleType.name}
                                                                        checked={data.sample_types.includes(
                                                                            sampleType.id
                                                                        )}
                                                                        onChange={toggleSampleType(
                                                                            sampleType.id
                                                                        )}
                                                                    />
                                                                </Grid>
                                                            )
                                                        )}
                                                    </Grid>
                                                </Box>
                                            )}
                                        </Stack>
                                    )}

                                    {(kitError || errors.sample_types) && (
                                        <Alert severity="error" sx={{ mt: 1.5 }}>
                                            {kitError || errors.sample_types}
                                        </Alert>
                                    )}
                                </Section>
                            )}
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                        <Stack spacing={3.5}>
                            <Section
                                step={`${stepOffset + 2}`}
                                title={
                                    isOrder ? "When should we deliver?" : "When should we collect?"
                                }
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

                            <Section
                                step={`${stepOffset + 3}`}
                                title="Anything we should know?"
                                hint="Optional."
                            >
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
                    {isOrder ? (
                        <KitIcon fontSize="small" color={canSubmit ? "primary" : "disabled"} />
                    ) : (
                        <ScienceIcon fontSize="small" color={canSubmit ? "primary" : "disabled"} />
                    )}
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {summary()}
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
