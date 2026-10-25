import React, { useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import {
    Alert,
    Button,
    Chip,
    Grid,
    Paper,
    Stack,
    Step,
    StepLabel,
    Stepper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { AccountTree as AccountTreeIcon } from "@mui/icons-material";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import RequestCard from "./Components/RequestCard";
import Messages from "./Components/Messages";
import Documents from "./Components/Documents";
import ReasonDialog from "./Components/ReasonDialog";
import QuotationCard from "./Components/QuotationCard";
import { exceptionLabel, ownerColor, ownerLabel } from "./Components/stage";

const Show = () => {
    const { preOrder, orders, actions, canAct, canApproveFinance, errors, status, success } =
        usePage().props;
    const [dialog, setDialog] = useState(null);
    const patientName = (ref) => preOrder.patients.find((p) => p.ref === ref)?.fullName ?? "—";
    const onHold = preOrder.exception?.type === "hold_center";
    const isClosed = Boolean(preOrder.closed_at);
    const orderFor = (key) => orders.find((o) => o.release_key === key);
    const quotations = preOrder.quotations ?? [];
    const mainQuotations = quotations.filter((q) => !q.request).reverse();
    const quotationFor = (number) => quotations.find((q) => q.request === number);

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

            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={2}
                >
                    <Stack spacing={0.5}>
                        <Typography variant="h5" fontWeight={700}>
                            {preOrder.code} · {patientName(preOrder.main_patient_ref)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {preOrder.main_test
                                ? `${preOrder.main_test.name} (${preOrder.main_test.code})`
                                : "BION is choosing the right test"}
                            {preOrder.counsellor ? ` · Counsellor: ${preOrder.counsellor}` : ""}
                        </Typography>
                        <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ pt: 1 }}
                        >
                            <Chip label={preOrder.stage.label} />
                            <Chip
                                color={ownerColor(preOrder.stage.owner)}
                                label={ownerLabel(preOrder.stage.owner)}
                            />
                            {preOrder.exception && (
                                <Chip color="error" label={exceptionLabel(preOrder.exception)} />
                            )}
                        </Stack>
                        {preOrder.stage.next_action && (
                            <Typography variant="body2" sx={{ pt: 1 }}>
                                Next: {preOrder.stage.next_action}
                            </Typography>
                        )}
                    </Stack>
                    {canAct && (
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                            {onHold ? (
                                <Button
                                    variant="outlined"
                                    onClick={() =>
                                        router.post(
                                            route("preOrders.resume", preOrder.id),
                                            {},
                                            { preserveScroll: true }
                                        )
                                    }
                                >
                                    Resume
                                </Button>
                            ) : (
                                !preOrder.exception && (
                                    <Button variant="outlined" onClick={() => setDialog("hold")}>
                                        Ask to hold
                                    </Button>
                                )
                            )}
                            <Button color="error" onClick={() => setDialog("cancel")}>
                                Cancel
                            </Button>
                        </Stack>
                    )}
                </Stack>
                <Stepper
                    activeStep={preOrder.progress.findIndex((s) => s.current)}
                    alternativeLabel
                    sx={{ mt: 3, overflowX: "auto" }}
                >
                    {preOrder.progress.map((s) => (
                        <Step key={s.code} completed={s.done}>
                            <StepLabel>{s.label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Paper>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Stack spacing={2}>
                        {mainQuotations.length > 0 && (
                            <Stack spacing={1}>
                                <Typography variant="subtitle1">
                                    Recommendation and finance
                                </Typography>
                                {mainQuotations.map((q) => (
                                    <QuotationCard
                                        key={q.number}
                                        preOrderId={preOrder.id}
                                        quotation={q}
                                        patientName={patientName}
                                        canApprove={Boolean(canApproveFinance)}
                                    />
                                ))}
                            </Stack>
                        )}
                        {preOrder.orders_to_place.length > 0 && (
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                    Orders to place
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    The tests are agreed. Complete each order with the sample
                                    details and send it as usual.
                                </Typography>
                                <Table size="small">
                                    <TableBody>
                                        {preOrder.orders_to_place.map((r) => {
                                            const order = orderFor(r.release_key);
                                            const testName = (id) =>
                                                preOrder.items.find((i) => i.test_id === id)
                                                    ?.test_name ?? id;
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
                                                        {order ? (
                                                            order.status === "pending" ? (
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
                                                                    href={route(
                                                                        "orders.show",
                                                                        order.id
                                                                    )}
                                                                >
                                                                    {order.orderId} · {order.status}
                                                                </Button>
                                                            )
                                                        ) : (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                            >
                                                                Preparing…
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </Paper>
                        )}

                        {preOrder.requests.length > 0 && (
                            <Stack spacing={1}>
                                <Typography variant="subtitle1">Requests from BION</Typography>
                                {[...preOrder.requests].reverse().map((r) => (
                                    <RequestCard
                                        key={r.number}
                                        preOrderId={preOrder.id}
                                        request={r}
                                        canAct={canAct}
                                    >
                                        {quotationFor(r.number) && (
                                            <QuotationCard
                                                preOrderId={preOrder.id}
                                                quotation={quotationFor(r.number)}
                                                patientName={patientName}
                                                canApprove={Boolean(canApproveFinance)}
                                            />
                                        )}
                                    </RequestCard>
                                ))}
                            </Stack>
                        )}

                        <Stack spacing={1}>
                            <Typography variant="subtitle1">Files</Typography>
                            <Documents
                                preOrderId={preOrder.id}
                                documents={preOrder.documents ?? []}
                                requests={preOrder.requests}
                                canAct={canAct}
                            />
                        </Stack>

                        <Stack spacing={1}>
                            <Typography variant="subtitle1">Messages</Typography>
                            <Messages
                                preOrderId={preOrder.id}
                                history={preOrder.history}
                                canMessage={canAct || isClosed}
                            />
                        </Stack>
                    </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                    <Stack spacing={2}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
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
                                                    {i.added_by === "bion" && (
                                                        <Chip
                                                            size="small"
                                                            variant="outlined"
                                                            label="Recommended by BION"
                                                            sx={{ ml: 1 }}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>{patientName(i.patient_ref)}</TableCell>
                                                <TableCell>{i.status}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                Case
                            </Typography>
                            {preOrder.referral_reason && (
                                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>
                                    {preOrder.referral_reason}
                                </Typography>
                            )}
                            {preOrder.patients.map((p) => (
                                <Typography key={p.ref} variant="body2">
                                    {p.fullName}
                                    {p.relationship ? ` · ${p.relationship}` : ""}
                                    {p.dateOfBirth ? ` · ${p.dateOfBirth}` : ""}
                                </Typography>
                            ))}
                        </Paper>
                    </Stack>
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
