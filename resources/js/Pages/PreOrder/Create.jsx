import React from "react";
import { useForm, usePage } from "@inertiajs/react";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    FormControlLabel,
    MenuItem,
    Paper,
    Stack,
    Switch,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { AccountTree as AccountTreeIcon, Add as AddIcon } from "@mui/icons-material";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import PatientRow from "./Components/PatientRow";

const HINTS = [
    { value: "ivf_pgt", label: "IVF / embryo testing" },
    { value: "pregnancy", label: "Pregnancy" },
    { value: "diagnosis", label: "Diagnosis of a patient" },
    { value: "carrier", label: "Carrier screening" },
    { value: "other", label: "Other" },
];

const Create = () => {
    const { tests } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        start_mode: tests.length ? "tests" : "describe",
        start_hint: null,
        referral_reason: "",
        patients: [{}],
        tests: [],
        clinical: { indication: "" },
    });

    const setPatient = (i, value) =>
        setData(
            "patients",
            data.patients.map((p, j) => (j === i ? value : p))
        );
    const selected = tests.filter((t) => data.tests.some((s) => s.id === t.id));
    const setAnswer = (testId, key, value) =>
        setData(
            "tests",
            data.tests.map((t) =>
                t.id === testId ? { ...t, scope: { ...(t.scope ?? {}), [key]: value } } : t
            )
        );

    const submit = (e) => {
        e.preventDefault();
        post(route("preOrders.store"));
    };

    return (
        <Box component="form" onSubmit={submit}>
            <PageHeader
                title="New pre-order"
                subtitle="BION reviews the case first. Once the tests are agreed you place the order as usual."
            />
            {errors.action && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.action}
                </Alert>
            )}
            <Stack spacing={3}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        How would you like to start?
                    </Typography>
                    <ToggleButtonGroup
                        exclusive
                        value={data.start_mode}
                        onChange={(_, v) => v && setData("start_mode", v)}
                    >
                        <ToggleButton value="tests" disabled={!tests.length}>
                            I know the test
                        </ToggleButton>
                        <ToggleButton value="describe">
                            Describe the case, BION advises
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {data.start_mode === "tests" ? (
                        <Autocomplete
                            multiple
                            sx={{ mt: 2 }}
                            options={tests}
                            value={selected}
                            getOptionLabel={(t) => `${t.name} (${t.code})`}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            onChange={(_, v) =>
                                setData(
                                    "tests",
                                    v.map(
                                        (t) => data.tests.find((s) => s.id === t.id) ?? { id: t.id }
                                    )
                                )
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Tests"
                                    error={Boolean(errors.tests || errors["tests.0.id"])}
                                    helperText={errors.tests || errors["tests.0.id"]}
                                />
                            )}
                        />
                    ) : (
                        <Stack spacing={2} sx={{ mt: 2 }}>
                            <TextField
                                select
                                label="What is it about?"
                                value={data.start_hint ?? ""}
                                onChange={(e) => setData("start_hint", e.target.value || null)}
                                sx={{ maxWidth: 320 }}
                            >
                                <MenuItem value="">—</MenuItem>
                                {HINTS.map((h) => (
                                    <MenuItem key={h.value} value={h.value}>
                                        {h.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                multiline
                                minRows={4}
                                label="Describe the case"
                                value={data.referral_reason}
                                onChange={(e) => setData("referral_reason", e.target.value)}
                                error={Boolean(errors.referral_reason)}
                                helperText={
                                    errors.referral_reason ||
                                    "History, findings, what the family wants to know"
                                }
                                inputProps={{ maxLength: 5000 }}
                            />
                        </Stack>
                    )}
                    {data.start_mode === "tests" &&
                        selected
                            .filter((t) => t.scope?.length)
                            .map((t) => (
                                <Stack key={t.id} spacing={1} sx={{ mt: 2 }}>
                                    <Typography variant="body2" fontWeight={600}>
                                        {t.name}
                                    </Typography>
                                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                                        {t.scope.map((q) => {
                                            const answer = data.tests.find((s) => s.id === t.id)
                                                ?.scope?.[q.key];
                                            return q.type === "number" ? (
                                                <TextField
                                                    key={q.key}
                                                    size="small"
                                                    type="number"
                                                    label={q.label}
                                                    value={answer ?? ""}
                                                    onChange={(e) =>
                                                        setAnswer(
                                                            t.id,
                                                            q.key,
                                                            e.target.value === ""
                                                                ? null
                                                                : Number(e.target.value)
                                                        )
                                                    }
                                                    inputProps={{ min: 0, max: 99 }}
                                                    sx={{ width: 140 }}
                                                />
                                            ) : (
                                                <FormControlLabel
                                                    key={q.key}
                                                    control={
                                                        <Switch
                                                            checked={Boolean(answer)}
                                                            onChange={(e) =>
                                                                setAnswer(
                                                                    t.id,
                                                                    q.key,
                                                                    e.target.checked
                                                                )
                                                            }
                                                        />
                                                    }
                                                    label={q.label}
                                                />
                                            );
                                        })}
                                    </Stack>
                                    {t.scope.some((q) => q.needs_finance) && (
                                        <Typography variant="caption" color="text.secondary">
                                            Some answers change the price: BION will send a
                                            quotation for your approval first.
                                        </Typography>
                                    )}
                                </Stack>
                            ))}
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        sx={{ mt: 2 }}
                        label="Clinical indication (optional)"
                        value={data.clinical.indication}
                        onChange={(e) =>
                            setData("clinical", { ...data.clinical, indication: e.target.value })
                        }
                        inputProps={{ maxLength: 2000 }}
                    />
                </Paper>

                <Stack spacing={2}>
                    <Typography variant="subtitle1">Patients</Typography>
                    {data.patients.map((p, i) => (
                        <PatientRow
                            key={i}
                            index={i}
                            patient={p}
                            errors={errors}
                            onChange={(v) => setPatient(i, v)}
                            onRemove={
                                i > 0
                                    ? () =>
                                          setData(
                                              "patients",
                                              data.patients.filter((_, j) => j !== i)
                                          )
                                    : undefined
                            }
                        />
                    ))}
                    {data.patients.length < 10 && (
                        <Button
                            startIcon={<AddIcon />}
                            onClick={() => setData("patients", [...data.patients, {}])}
                            sx={{ alignSelf: "flex-start" }}
                        >
                            Add a patient (partner, child, fetus…)
                        </Button>
                    )}
                </Stack>

                <Box>
                    <Button type="submit" variant="contained" disabled={processing}>
                        Send to BION
                    </Button>
                </Box>
            </Stack>
        </Box>
    );
};

Create.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            {
                title: "Pre-orders",
                link: route("preOrders.index"),
                icon: <AccountTreeIcon fontSize="small" />,
            },
            { title: "New", link: null },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default Create;
