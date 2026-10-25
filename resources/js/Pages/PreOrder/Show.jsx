import React, { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    Stack,
    Step,
    StepLabel,
    Stepper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tabs,
    Typography,
} from "@mui/material";
import { AccountTree as AccountTreeIcon, MoreVert as MoreIcon } from "@mui/icons-material";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import QuotationCard from "./Components/QuotationCard";
import RequestCard from "./Components/RequestCard";
import BatchesCard from "./Components/BatchesCard";
import Documents from "./Components/Documents";
import Messages from "./Components/Messages";
import NextSteps from "./Components/NextSteps";
import ReasonDialog from "./Components/ReasonDialog";
import { exceptionLabel, ownerColor, ownerLabel } from "./Components/stage";

const ITEM_STATUS = {
    requested: "Requested",
    recommended: "Proposed by BION",
    approved: "Approved",
    released: "Sent to the lab",
};

/** The case header: who and what, where it is, and the rarely used hold/cancel actions. */
function Header({ preOrder, patientName, canAct, onDialog }) {
    const [menu, setMenu] = useState(null);
    const onHold = preOrder.exception?.type === "hold_center";
    const current = preOrder.progress.findIndex((s) => s.current);

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        {patientName(preOrder.main_patient_ref)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {preOrder.code}
                        {" · "}
                        {preOrder.main_test ? preOrder.main_test.name : "BION is choosing the test"}
                        {preOrder.counsellor ? ` · Counsellor: ${preOrder.counsellor}` : ""}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ pt: 1 }}>
                        <Chip
                            color={ownerColor(preOrder.stage.owner)}
                            label={`${preOrder.stage.label} · ${ownerLabel(preOrder.stage.owner)}`}
                        />
                        {preOrder.exception && (
                            <Chip color="error" label={exceptionLabel(preOrder.exception)} />
                        )}
                    </Stack>
                </Box>
                {canAct && !onHold && !preOrder.exception && (
                    <Box>
                        <IconButton
                            aria-label="More actions"
                            onClick={(e) => setMenu(e.currentTarget)}
                        >
                            <MoreIcon />
                        </IconButton>
                        <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)}>
                            <MenuItem
                                onClick={() => {
                                    setMenu(null);
                                    onDialog("hold");
                                }}
                            >
                                Ask BION to hold
                            </MenuItem>
                            <MenuItem
                                sx={{ color: "error.main" }}
                                onClick={() => {
                                    setMenu(null);
                                    onDialog("cancel");
                                }}
                            >
                                Cancel pre-order
                            </MenuItem>
                        </Menu>
                    </Box>
                )}
            </Stack>
            {preOrder.progress.length > 0 && (
                <Box sx={{ overflowX: "auto", mt: 2 }}>
                    <Stepper activeStep={current} alternativeLabel sx={{ minWidth: 560 }}>
                        {preOrder.progress.map((s) => (
                            <Step key={s.code} completed={s.done}>
                                <StepLabel>{s.label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>
            )}
        </Paper>
    );
}

/** The tests and the patients the case is about. */
function Overview({ preOrder, patientName }) {
    return (
        <Stack spacing={2}>
            <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Tests
                </Typography>
                {preOrder.items.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        BION will propose the tests after reviewing the case.
                    </Typography>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Test</TableCell>
                                <TableCell>Patient</TableCell>
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {preOrder.items.map((i) => (
                                <TableRow key={i.id}>
                                    <TableCell>
                                        {i.test_name}
                                        {i.test_id === preOrder.main_test?.id && (
                                            <Chip size="small" label="Main" sx={{ ml: 1 }} />
                                        )}
                                    </TableCell>
                                    <TableCell>{patientName(i.patient_ref)}</TableCell>
                                    <TableCell>{ITEM_STATUS[i.status] ?? i.status}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Box>
            <Divider />
            <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Patients
                </Typography>
                {preOrder.patients.map((p) => (
                    <Typography key={p.ref} variant="body2">
                        <strong>{p.fullName}</strong>
                        {p.ref === preOrder.main_patient_ref
                            ? " · main patient"
                            : p.relationship
                              ? ` · ${p.relationship}`
                              : ""}
                        {p.dateOfBirth ? ` · born ${p.dateOfBirth}` : ""}
                    </Typography>
                ))}
            </Box>
            {preOrder.referral_reason && (
                <>
                    <Divider />
                    <Box>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            Why you referred
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {preOrder.referral_reason}
                        </Typography>
                    </Box>
                </>
            )}
        </Stack>
    );
}

/** Every order this pre-order opened, and the batches of samples sent for it. */
function Samples({ preOrder, orders, canAct, patientName }) {
    const orderFor = (key) => orders.find((o) => o.release_key === key);
    const testName = (id) => preOrder.items.find((i) => i.test_id === id)?.test_name ?? id;

    return (
        <Stack spacing={2}>
            {preOrder.orders_to_place.length > 0 && (
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Tests</TableCell>
                            <TableCell align="right">Order</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {preOrder.orders_to_place.map((r) => {
                            const order = orderFor(r.release_key);
                            return (
                                <TableRow key={r.release_key}>
                                    <TableCell>
                                        {r.items
                                            .map(
                                                (i) =>
                                                    `${testName(i.test_id)} — ${patientName(i.patient_ref)}`
                                            )
                                            .join(", ")}
                                    </TableCell>
                                    <TableCell align="right">
                                        {!order ? (
                                            <Typography variant="caption" color="text.secondary">
                                                Preparing…
                                            </Typography>
                                        ) : order.status === "pending" ? (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                component={Link}
                                                href={route("orders.edit", {
                                                    order: order.id,
                                                    step: order.step,
                                                })}
                                            >
                                                Complete order
                                            </Button>
                                        ) : (
                                            <Button
                                                size="small"
                                                component={Link}
                                                href={route("orders.show", order.id)}
                                            >
                                                {order.orderId} · {order.status}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}
            <BatchesCard preOrder={preOrder} orders={orders} canAct={canAct} />
        </Stack>
    );
}

/** Earlier requests and quotations, once they are settled. Open ones sit in "What you need to do". */
function Past({ preOrder, patientName }) {
    const quotations = (preOrder.quotations ?? []).filter((q) => q.status !== "awaiting_center");
    const requests = preOrder.requests.filter((r) => r.status !== "open");
    const quotationFor = (number) => quotations.find((q) => q.request === number);

    return (
        <Stack spacing={2}>
            {quotations
                .filter((q) => !q.request)
                .reverse()
                .map((q) => (
                    <QuotationCard
                        key={q.number}
                        preOrderId={preOrder.id}
                        quotation={q}
                        patientName={patientName}
                        canApprove={false}
                    />
                ))}
            {[...requests].reverse().map((r) => (
                <RequestCard key={r.number} preOrderId={preOrder.id} request={r} canAct={false}>
                    {quotationFor(r.number) && (
                        <QuotationCard
                            preOrderId={preOrder.id}
                            quotation={quotationFor(r.number)}
                            patientName={patientName}
                            canApprove={false}
                        />
                    )}
                </RequestCard>
            ))}
        </Stack>
    );
}

const Show = () => {
    const { preOrder, orders, actions, canAct, canApproveFinance, errors, status, success } =
        usePage().props;
    const [dialog, setDialog] = useState(null);
    const [tab, setTab] = useState("overview");
    const patientName = (ref) => preOrder.patients.find((p) => p.ref === ref)?.fullName ?? "—";
    const isClosed = Boolean(preOrder.closed_at);
    const hasSamples =
        preOrder.orders_to_place.length > 0 ||
        (preOrder.batches ?? []).length > 0 ||
        Boolean(preOrder.center_can?.confirm_next_step);
    const pastCount =
        (preOrder.quotations ?? []).filter((q) => q.status !== "awaiting_center").length +
        preOrder.requests.filter((r) => r.status !== "open").length;

    return (
        <>
            {errors?.action && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.action}
                </Alert>
            )}
            {success && status && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {status}
                </Alert>
            )}
            {actions.map((a) => (
                <Alert
                    key={a.id}
                    severity={a.status === "failed" ? "error" : "info"}
                    sx={{ mb: 1 }}
                >
                    {a.status === "failed" ? `Not applied: ${a.error}` : "Sending to BION…"}
                </Alert>
            ))}

            <Header
                preOrder={preOrder}
                patientName={patientName}
                canAct={Boolean(canAct)}
                onDialog={setDialog}
            />

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <NextSteps
                        preOrder={preOrder}
                        orders={orders}
                        canAct={Boolean(canAct)}
                        canApproveFinance={Boolean(canApproveFinance)}
                        patientName={patientName}
                        onShowSamples={() => setTab("samples")}
                    />
                    <Paper variant="outlined">
                        <Tabs
                            value={tab}
                            onChange={(_, v) => setTab(v)}
                            variant="scrollable"
                            sx={{ borderBottom: 1, borderColor: "divider", px: 1 }}
                        >
                            <Tab value="overview" label="Tests & patients" />
                            <Tab
                                value="files"
                                label={`Files (${(preOrder.documents ?? []).length})`}
                            />
                            {hasSamples && <Tab value="samples" label="Samples & orders" />}
                            {pastCount > 0 && (
                                <Tab value="past" label={`Earlier requests (${pastCount})`} />
                            )}
                        </Tabs>
                        <Box sx={{ p: 2 }}>
                            {tab === "overview" && (
                                <Overview preOrder={preOrder} patientName={patientName} />
                            )}
                            {tab === "files" && (
                                <Documents
                                    preOrderId={preOrder.id}
                                    documents={preOrder.documents ?? []}
                                    requests={preOrder.requests}
                                    canAct={canAct}
                                />
                            )}
                            {tab === "samples" && hasSamples && (
                                <Samples
                                    preOrder={preOrder}
                                    orders={orders}
                                    canAct={Boolean(canAct)}
                                    patientName={patientName}
                                />
                            )}
                            {tab === "past" && (
                                <Past preOrder={preOrder} patientName={patientName} />
                            )}
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ position: { md: "sticky" }, top: { md: 16 } }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            Messages with BION
                        </Typography>
                        <Messages
                            preOrderId={preOrder.id}
                            history={preOrder.history}
                            canMessage={canAct || isClosed}
                        />
                    </Box>
                </Grid>
            </Grid>
            {dialog && (
                <ReasonDialog
                    preOrderId={preOrder.id}
                    kind={dialog}
                    onClose={() => setDialog(null)}
                />
            )}
        </>
    );
};

Show.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            {
                title: "Pre-orders",
                link: route("preOrders.index"),
                icon: <AccountTreeIcon fontSize="small" />,
            },
            { title: page.props.preOrder.code, link: null },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default Show;
