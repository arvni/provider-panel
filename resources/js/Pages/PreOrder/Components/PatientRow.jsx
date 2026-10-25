import React, { useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import {
    Autocomplete,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import countries from "@/Data/countries";

const RELATIONSHIPS = ["self", "spouse", "partner", "child", "parent", "sibling", "fetus", "other"];

/** One patient of the pre-order: one of the center's patients, or a new one. */
export default function PatientRow({ index, patient, errors, onChange, onRemove }) {
    const [options, setOptions] = useState([]);
    const err = (field) => errors[`patients.${index}.${field}`];

    const search = (text) =>
        axios
            .get(route("api.patients.list"), { params: { search: text } })
            .then((r) => setOptions(r.data.data));

    const pickExisting = (_, value) =>
        onChange(
            value
                ? { id: value.id, fullName: value.fullName, relationship: patient.relationship }
                : { relationship: patient.relationship }
        );

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
            >
                <Typography variant="subtitle2">
                    {index === 0 ? "Main patient" : `Patient ${index + 1}`}
                </Typography>
                {onRemove && (
                    <IconButton size="small" onClick={onRemove} aria-label="Remove patient">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                )}
            </Stack>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Autocomplete
                        options={options}
                        getOptionLabel={(o) => `${o.fullName}${o.id_no ? ` · ${o.id_no}` : ""}`}
                        onInputChange={(_, text, reason) =>
                            reason === "input" && text.length > 1 && search(text)
                        }
                        onChange={pickExisting}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        filterOptions={(x) => x}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                size="small"
                                label="Find one of your patients (or fill in below)"
                            />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                        select
                        fullWidth
                        size="small"
                        label="Relationship"
                        value={patient.relationship ?? ""}
                        onChange={(e) =>
                            onChange({ ...patient, relationship: e.target.value || null })
                        }
                    >
                        <MenuItem value="">—</MenuItem>
                        {RELATIONSHIPS.map((r) => (
                            <MenuItem key={r} value={r}>
                                {r}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                {!patient.id && (
                    <>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Full name"
                                value={patient.fullName ?? ""}
                                onChange={(e) => onChange({ ...patient, fullName: e.target.value })}
                                error={Boolean(err("fullName"))}
                                helperText={err("fullName")}
                            />
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Gender"
                                value={patient.gender ?? ""}
                                onChange={(e) => onChange({ ...patient, gender: e.target.value })}
                                error={Boolean(err("gender"))}
                                helperText={err("gender")}
                            >
                                <MenuItem value="1">Male</MenuItem>
                                <MenuItem value="0">Female</MenuItem>
                                <MenuItem value="-1">Unknown</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="Date of birth"
                                InputLabelProps={{ shrink: true }}
                                value={patient.dateOfBirth ?? ""}
                                onChange={(e) =>
                                    onChange({ ...patient, dateOfBirth: e.target.value })
                                }
                                error={Boolean(err("dateOfBirth"))}
                                helperText={err("dateOfBirth")}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Autocomplete
                                options={countries}
                                value={patient.nationality ?? null}
                                getOptionLabel={(o) => o.label}
                                isOptionEqualToValue={(o, v) => o.code === v.code}
                                onChange={(_, v) => onChange({ ...patient, nationality: v })}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        size="small"
                                        label="Nationality"
                                        error={Boolean(err("nationality.code"))}
                                        helperText={err("nationality.code")}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 6, md: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="ID number"
                                value={patient.id_no ?? ""}
                                onChange={(e) => onChange({ ...patient, id_no: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 6, md: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Your reference"
                                value={patient.reference_id ?? ""}
                                onChange={(e) =>
                                    onChange({ ...patient, reference_id: e.target.value })
                                }
                            />
                        </Grid>
                    </>
                )}
            </Grid>
        </Paper>
    );
}

PatientRow.propTypes = {
    index: PropTypes.number.isRequired,
    patient: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    onRemove: PropTypes.func,
};
