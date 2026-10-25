import React from "react";
import PropTypes from "prop-types";
import { Link, router } from "@inertiajs/react";
import { Alert, AlertTitle, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { CheckCircleOutline as DoneIcon } from "@mui/icons-material";
import QuotationCard from "./QuotationCard";
import RequestCard from "./RequestCard";

/**
 * The one place a center looks first: everything BION is waiting for from them right now, each
 * with its own button. When nothing is needed it says what BION is doing instead.
 */
export default function NextSteps({
    preOrder,
    orders,
    canAct,
    canApproveFinance,
    patientName,
    onShowSamples,
}) {
    const can = preOrder.center_can ?? {};
    const quotations = (preOrder.quotations ?? []).filter((q) => q.status === "awaiting_center");
    const requests = preOrder.requests.filter((r) => r.status === "open");
    const orderFor = (key) => orders.find((o) => o.release_key === key);
    const ordersToComplete = preOrder.orders_to_place.filter((r) => {
        const order = orderFor(r.release_key);
        return !order || order.status === "pending";
    });
    const samplesNeeded = can.confirm_next_step || can.add_batch || Boolean(can.replace_batch);
    const onHold = preOrder.exception?.type === "hold_center";
    const requestLabel = (number) => preOrder.requests.find((r) => r.number === number)?.label;
    const testName = (id) => preOrder.items.find((i) => i.test_id === id)?.test_name ?? id;

    const nothing =
        !quotations.length &&
        !requests.length &&
        !ordersToComplete.length &&
        !samplesNeeded &&
        !onHold;

    if (preOrder.closed_at) {
        return (
            <Alert severity="info" sx={{ mb: 2 }}>
                This pre-order is closed. You can still send BION a message.
            </Alert>
        );
    }

    if (nothing) {
        return (
            <Alert icon={<DoneIcon />} severity="success" sx={{ mb: 2 }}>
                <AlertTitle>Nothing needed from you right now</AlertTitle>
                {preOrder.stage.next_action
                    ? `Next: ${preOrder.stage.next_action}`
                    : "BION is working on this case. We'll let you know when you need to act."}
            </Alert>
        );
    }

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: "warning.main", borderWidth: 2 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
                What you need to do
            </Typography>
            <Stack spacing={2}>
                {onHold && (
                    <Alert
                        severity="warning"
                        action={
                            canAct && (
                                <Button
                                    color="inherit"
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
                            )
                        }
                    >
                        You asked BION to hold this case. Resume it when you are ready.
                    </Alert>
                )}

                {quotations.map((q) => (
                    <Box key={q.number}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            {q.request
                                ? `Approve the cost of: ${requestLabel(q.request) ?? "additional tests"}`
                                : "Approve the cost of the tests"}
                        </Typography>
                        <QuotationCard
                            preOrderId={preOrder.id}
                            quotation={q}
                            patientName={patientName}
                            canApprove={canApproveFinance}
                        />
                    </Box>
                ))}

                {requests.map((r) => (
                    <Box key={r.number}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            BION asked you
                        </Typography>
                        <RequestCard preOrderId={preOrder.id} request={r} canAct={canAct} />
                    </Box>
                ))}

                {ordersToComplete.length > 0 && (
                    <Box>
                        <Typography variant="subtitle2">Send the samples</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            The tests are agreed. Complete each order with the sample details and
                            send it as usual.
                        </Typography>
                        <Stack spacing={1}>
                            {ordersToComplete.map((r) => {
                                const order = orderFor(r.release_key);
                                return (
                                    <Stack
                                        key={r.release_key}
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={1}
                                        justifyContent="space-between"
                                        alignItems={{ sm: "center" }}
                                    >
                                        <Typography variant="body2">
                                            {r.items
                                                .map(
                                                    (i) =>
                                                        `${testName(i.test_id)} — ${patientName(i.patient_ref)}`
                                                )
                                                .join(", ")}
                                        </Typography>
                                        {order ? (
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
                                            <Typography variant="caption" color="text.secondary">
                                                Preparing the order…
                                            </Typography>
                                        )}
                                    </Stack>
                                );
                            })}
                        </Stack>
                    </Box>
                )}

                {samplesNeeded && (
                    <Alert
                        severity="warning"
                        action={
                            <Button color="inherit" onClick={onShowSamples}>
                                Open samples
                            </Button>
                        }
                    >
                        {can.replace_batch
                            ? "A sample needs replacing."
                            : can.confirm_next_step
                              ? "The pre-test workup is done. Confirm the next step."
                              : "Add the next batch of samples, or tell BION there are no more."}
                    </Alert>
                )}
            </Stack>
        </Paper>
    );
}

NextSteps.propTypes = {
    preOrder: PropTypes.object.isRequired,
    orders: PropTypes.array.isRequired,
    canAct: PropTypes.bool,
    canApproveFinance: PropTypes.bool,
    patientName: PropTypes.func.isRequired,
    onShowSamples: PropTypes.func.isRequired,
};
