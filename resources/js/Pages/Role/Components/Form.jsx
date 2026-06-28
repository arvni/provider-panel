import { useMemo, useState } from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Checkbox,
    Chip,
    CircularProgress,
    FormControlLabel,
    InputAdornment,
    Paper,
    Stack,
    Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";

// Turn "OrderMaterial" / "CollectRequest" into "Order Material" / "Collect Request".
const humanize = (str = "") =>
    String(str)
        .replace(/([a-z\d])([A-Z])/g, "$1 $2")
        .replace(/[_.-]+/g, " ")
        .trim();

// Friendlier labels for the common CRUD-style action suffixes.
const ACTION_LABELS = {
    Index: "List",
    Show: "View",
    Create: "Create",
    Update: "Edit",
    Delete: "Delete",
    Sync: "Sync",
};

const actionLabel = (permission) => {
    const last = String(permission.key ?? permission.name ?? "")
        .split(".")
        .pop();
    return ACTION_LABELS[last] ?? humanize(permission.name ?? last);
};

const isLeaf = (node) =>
    node &&
    typeof node === "object" &&
    !Array.isArray(node) &&
    Object.prototype.hasOwnProperty.call(node, "id");

// Recursively collect every leaf permission below a node in the grouped tree.
const collectLeaves = (node, acc = []) => {
    if (!node || typeof node !== "object") return acc;
    if (isLeaf(node)) {
        acc.push(node);
        return acc;
    }
    Object.keys(node).forEach((key) => collectLeaves(node[key], acc));
    return acc;
};

// Render a group of leaf permissions as a row of toggle chips/checkboxes.
function LeafGroup({ leaves, selectedIds, onToggle }) {
    return (
        <Grid container spacing={1}>
            {leaves.map((permission) => {
                const checked = selectedIds.has(permission.id);
                return (
                    <Grid key={permission.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                        <Tooltip title={permission.key ?? ""} placement="top" arrow>
                            <FormControlLabel
                                sx={{
                                    m: 0,
                                    width: "100%",
                                    borderRadius: 1,
                                    "&:hover": { bgcolor: "action.hover" },
                                }}
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={checked}
                                        onChange={(e) =>
                                            onToggle([permission.id], e.target.checked)
                                        }
                                    />
                                }
                                label={
                                    <Typography variant="body2">
                                        {actionLabel(permission)}
                                    </Typography>
                                }
                            />
                        </Tooltip>
                    </Grid>
                );
            })}
        </Grid>
    );
}

// A nested sub-group (e.g. a resource under a section) with its own select-all control.
function SubGroup({ name, node, selectedIds, onToggle }) {
    const leaves = useMemo(() => collectLeaves(node), [node]);
    const selectedCount = leaves.filter((p) => selectedIds.has(p.id)).length;
    const allSelected = selectedCount === leaves.length && leaves.length > 0;
    const someSelected = selectedCount > 0 && !allSelected;

    return (
        <Box sx={{ mb: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <FormControlLabel
                    sx={{ m: 0 }}
                    control={
                        <Checkbox
                            size="small"
                            checked={allSelected}
                            indeterminate={someSelected}
                            onChange={(e) =>
                                onToggle(
                                    leaves.map((p) => p.id),
                                    e.target.checked
                                )
                            }
                        />
                    }
                    label={
                        <Typography variant="subtitle2">{humanize(name) || "General"}</Typography>
                    }
                />
                <Chip size="small" variant="outlined" label={`${selectedCount}/${leaves.length}`} />
            </Stack>
            <Box sx={{ pl: 3 }}>
                <LeafGroup leaves={leaves} selectedIds={selectedIds} onToggle={onToggle} />
            </Box>
        </Box>
    );
}

// A top-level section rendered as a collapsible card.
function Section({ name, node, selectedIds, onToggle, defaultExpanded }) {
    const leaves = useMemo(() => collectLeaves(node), [node]);
    if (leaves.length === 0) return null;

    const selectedCount = leaves.filter((p) => selectedIds.has(p.id)).length;
    const allSelected = selectedCount === leaves.length;
    const someSelected = selectedCount > 0 && !allSelected;

    // Direct children that are themselves groups vs. leaves living straight on the section.
    const childKeys = Object.keys(node);
    const directLeaves = childKeys.filter((k) => isLeaf(node[k])).map((k) => node[k]);
    const subGroups = childKeys.filter((k) => !isLeaf(node[k]));

    return (
        <Accordion defaultExpanded={defaultExpanded} disableGutters sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{ width: "100%", pr: 1 }}
                >
                    <Checkbox
                        size="small"
                        sx={{ p: 0.5 }}
                        checked={allSelected}
                        indeterminate={someSelected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                            onToggle(
                                leaves.map((p) => p.id),
                                e.target.checked
                            )
                        }
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
                        {humanize(name)}
                    </Typography>
                    <Chip
                        size="small"
                        color={selectedCount > 0 ? "primary" : "default"}
                        variant={selectedCount > 0 ? "filled" : "outlined"}
                        label={`${selectedCount}/${leaves.length}`}
                    />
                </Stack>
            </AccordionSummary>
            <AccordionDetails>
                {directLeaves.length > 0 && (
                    <Box sx={{ mb: subGroups.length ? 1.5 : 0 }}>
                        <LeafGroup
                            leaves={directLeaves}
                            selectedIds={selectedIds}
                            onToggle={onToggle}
                        />
                    </Box>
                )}
                {subGroups.map((key) => (
                    <SubGroup
                        key={key}
                        name={key}
                        node={node[key]}
                        selectedIds={selectedIds}
                        onToggle={onToggle}
                    />
                ))}
            </AccordionDetails>
        </Accordion>
    );
}

// Keep only the parts of the tree whose leaves match the search query.
const filterTree = (node, query) => {
    if (!query) return node;
    if (isLeaf(node)) {
        const haystack = `${node.name ?? ""} ${node.key ?? ""}`.toLowerCase();
        return haystack.includes(query) ? node : null;
    }
    const result = {};
    Object.keys(node).forEach((key) => {
        const keyMatches = (humanize(key) || "General").toLowerCase().includes(query);
        const child = keyMatches ? node[key] : filterTree(node[key], query);
        if (child && (isLeaf(child) || Object.keys(child).length)) result[key] = child;
    });
    return Object.keys(result).length ? result : null;
};

export default function RoleForm({
    data,
    setData,
    submit,
    permissions,
    edit,
    cancel,
    errors = {},
    loading = false,
}) {
    const [search, setSearch] = useState("");

    const selectedIds = useMemo(
        () => new Set((data.permissions ?? []).map((p) => p.id)),
        [data.permissions]
    );

    const allLeaves = useMemo(() => collectLeaves(permissions), [permissions]);
    const totalSelected = allLeaves.filter((p) => selectedIds.has(p.id)).length;

    const filtered = useMemo(
        () => filterTree(permissions, search.trim().toLowerCase()) ?? {},
        [permissions, search]
    );

    const handleToggle = (ids, checked) => {
        setData((prev) => {
            const current = new Set((prev.permissions ?? []).map((p) => p.id));
            ids.forEach((id) => (checked ? current.add(id) : current.delete(id)));
            return { ...prev, permissions: Array.from(current).map((id) => ({ id })) };
        });
    };

    const handleNameChange = (e) => setData((prev) => ({ ...prev, name: e.target.value }));

    const setAll = (checked) =>
        handleToggle(
            allLeaves.map((p) => p.id),
            checked
        );

    const sectionKeys = Object.keys(filtered);

    return (
        <Container sx={{ py: 3 }}>
            <Typography variant="h4" gutterBottom>
                {edit ? "Edit Role" : "Add New Role"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Give the role a name, then choose which permissions it should grant.
            </Typography>

            <TextField
                value={data.name ?? ""}
                name="name"
                label="Role title"
                onChange={handleNameChange}
                error={Boolean(errors.name)}
                helperText={errors.name ?? "A short, descriptive name (e.g. Lab Manager)."}
                fullWidth
                required
                sx={{ maxWidth: 480, mb: 3 }}
            />

            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    justifyContent="space-between"
                    spacing={2}
                    sx={{ mb: 1 }}
                >
                    <Box>
                        <Typography variant="h6">Permissions</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {totalSelected} of {allLeaves.length} selected
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Button size="small" onClick={() => setAll(true)}>
                            Select all
                        </Button>
                        <Button size="small" color="inherit" onClick={() => setAll(false)}>
                            Clear all
                        </Button>
                    </Stack>
                </Stack>

                <TextField
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search permissions…"
                    size="small"
                    fullWidth
                    sx={{ mb: 2 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />

                {errors.permissions && (
                    <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                        {errors.permissions}
                    </Typography>
                )}

                {sectionKeys.length === 0 ? (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ py: 2, textAlign: "center" }}
                    >
                        No permissions match “{search}”.
                    </Typography>
                ) : (
                    sectionKeys.map((key) => (
                        <Section
                            key={key}
                            name={key}
                            node={filtered[key]}
                            selectedIds={selectedIds}
                            onToggle={handleToggle}
                            defaultExpanded={Boolean(search)}
                        />
                    ))
                )}
            </Paper>

            <Divider sx={{ my: 2 }} />
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
                <Button onClick={cancel} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={submit}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {edit ? "Save changes" : "Create role"}
                </Button>
            </Stack>
        </Container>
    );
}
