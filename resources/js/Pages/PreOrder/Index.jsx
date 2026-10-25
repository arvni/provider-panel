import React from "react";
import { Link, router, usePage } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { AccountTree as AccountTreeIcon, Add as AddIcon } from "@mui/icons-material";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { exceptionLabel, ownerColor, ownerLabel, when } from "./Components/stage";

const Index = () => {
    const { preOrders, sending, filters, auth, status, success } = usePage().props;
    const canCreate = auth.permissions?.includes("PreOrder.Create");

    const filter = (changes) =>
        router.get(route("preOrders.index"), { ...filters, ...changes }, { preserveState: true });

    return (
        <>
            <PageHeader
                title="Pre-orders"
                subtitle="Cases BION reviews before you place the order"
                actions={
                    canCreate
                        ? [
                              <Button
                                  key="new"
                                  variant="contained"
                                  startIcon={<AddIcon />}
                                  component={Link}
                                  href={route("preOrders.create")}
                              >
                                  New pre-order
                              </Button>,
                          ]
                        : []
                }
            />
            {success && status && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {status}
                </Alert>
            )}
            {sending.map((s) => (
                <Alert
                    key={s.id}
                    severity={s.status === "failed" ? "error" : "info"}
                    sx={{ mb: 1 }}
                >
                    {s.status === "failed"
                        ? `Pre-order for ${s.patient ?? "a patient"} was not created: ${s.error}`
                        : `Sending the pre-order for ${s.patient ?? "a patient"} to BION…`}
                </Alert>
            ))}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
                <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={filters.waiting ?? "all"}
                    onChange={(_, v) => v && filter({ waiting: v === "all" ? undefined : v })}
                >
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="center">Waiting on you</ToggleButton>
                    <ToggleButton value="bion">With BION</ToggleButton>
                </ToggleButtonGroup>
                <TextField
                    size="small"
                    label="Search code"
                    defaultValue={filters.search ?? ""}
                    onKeyDown={(e) =>
                        e.key === "Enter" && filter({ search: e.target.value || undefined })
                    }
                />
            </Stack>
            <Paper variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Code</TableCell>
                            <TableCell>Patient</TableCell>
                            <TableCell>Test</TableCell>
                            <TableCell>Stage</TableCell>
                            <TableCell>Next</TableCell>
                            <TableCell>Updated</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {preOrders.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        No pre-orders yet.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                        {preOrders.data.map((p) => (
                            <TableRow
                                key={p.id}
                                hover
                                sx={{ cursor: "pointer" }}
                                onClick={() => router.visit(route("preOrders.show", p.id))}
                            >
                                <TableCell>{p.code}</TableCell>
                                <TableCell>{p.patient}</TableCell>
                                <TableCell>{p.main_test ?? "BION is choosing"}</TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        <span>{p.stage?.label}</span>
                                        {p.exception && (
                                            <Chip
                                                size="small"
                                                color="error"
                                                label={exceptionLabel(p.exception)}
                                            />
                                        )}
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        <Chip
                                            size="small"
                                            color={ownerColor(p.stage?.owner)}
                                            label={ownerLabel(p.stage?.owner)}
                                        />
                                        {p.open_requests > 0 && (
                                            <Chip
                                                size="small"
                                                color="warning"
                                                variant="outlined"
                                                label={`${p.open_requests} request(s)`}
                                            />
                                        )}
                                        {p.orders_to_place > 0 && (
                                            <Chip
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                                label="Order ready to place"
                                            />
                                        )}
                                    </Stack>
                                </TableCell>
                                <TableCell>{when(p.updated_at)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
            {preOrders.last_page > 1 && (
                <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                    {preOrders.prev_page_url && (
                        <Button component={Link} href={preOrders.prev_page_url}>
                            Previous
                        </Button>
                    )}
                    {preOrders.next_page_url && (
                        <Button component={Link} href={preOrders.next_page_url}>
                            Next
                        </Button>
                    )}
                </Box>
            )}
        </>
    );
};

Index.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            { title: "Pre-orders", link: null, icon: <AccountTreeIcon fontSize="small" /> },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default Index;
