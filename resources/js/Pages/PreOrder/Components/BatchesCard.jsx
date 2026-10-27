import React, { useState } from "react";
import PropTypes from "prop-types";
import { Link, router } from "@inertiajs/react";
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
    Typography,
} from "@mui/material";
import { hasEnded } from "./stage";

const post = (name, preOrder, data = {}) =>
    router.post(route(name, preOrder.id), data, { preserveScroll: true });

/**
 * The samples sent for this pre-order, batch by batch, with the order each one opened or joined.
 * After the pre-test workup the center confirms the next step; while batches are open it adds
 * another one or says there are no more; and it answers a sample issue with a replacement.
 */
export default function BatchesCard({ preOrder, orders, canAct }) {
    const can = preOrder.center_can ?? {};
    const batches = preOrder.batches ?? [];
    const [label, setLabel] = useState("");
    const [note, setNote] = useState("");
    const orderFor = (key) => orders.find((o) => o.release_key === key);
    const sharesOrder = preOrder.batch_mode !== "per_batch";

    if (batches.length === 0 && !can.confirm_next_step) {
        return null;
    }

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Samples and orders
            </Typography>

            {can.confirm_next_step && canAct && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    The pre-test workup is complete. Tell BION when you are ready for the main tests
                    (for example, once the IVF cycle is planned).
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
                        <TextField
                            size="small"
                            label="Note for BION (optional)"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            inputProps={{ maxLength: 2000 }}
                            sx={{ minWidth: 280 }}
                        />
                        <Button
                            variant="contained"
                            onClick={() =>
                                post("preOrders.nextStep", preOrder, { note: note || null })
                            }
                        >
                            Ready for the main tests
                        </Button>
                    </Stack>
                </Alert>
            )}

            {batches.length > 0 && (
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Batch</TableCell>
                            <TableCell>Order</TableCell>
                            <TableCell>At BION</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {batches.map((b) => {
                            const order = orderFor(b.order_key);
                            const replace = can.replace_batch === b.key;
                            return (
                                <TableRow key={b.key}>
                                    <TableCell>
                                        {b.label}
                                        {b.issue && (
                                            <Chip
                                                size="small"
                                                color="error"
                                                sx={{ ml: 1 }}
                                                label={`Sample issue: ${b.issue}`}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {order ? (
                                            <Button
                                                size="small"
                                                component={Link}
                                                href={
                                                    order.status === "pending" && order.editable
                                                        ? route("orders.edit", {
                                                              order: order.id,
                                                              step: order.step,
                                                          })
                                                        : route("orders.show", order.id)
                                                }
                                            >
                                                {order.status === "pending" && order.editable
                                                    ? "Complete order"
                                                    : `${order.orderId} · ${hasEnded(preOrder) ? "cancelled" : order.status}`}
                                            </Button>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">
                                                Preparing…
                                            </Typography>
                                        )}
                                        {b.order_key !== b.key && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ display: "block" }}
                                            >
                                                Same order; book a pickup for these samples
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {b.order
                                            ? b.order.received
                                                ? "Received"
                                                : "Not yet"
                                            : "—"}
                                    </TableCell>
                                    <TableCell align="right">
                                        {replace && canAct && (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="error"
                                                onClick={() =>
                                                    post("preOrders.batches.store", preOrder, {
                                                        replaces: b.key,
                                                    })
                                                }
                                            >
                                                Send a replacement
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}

            {can.add_batch && canAct && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        More samples to come?{" "}
                        {sharesOrder
                            ? "They are added to the same order; book a pickup for them as usual."
                            : "Each batch becomes its own order for you to complete."}
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <TextField
                            size="small"
                            label="Batch name (optional)"
                            placeholder="e.g. Embryo cycle 2"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            inputProps={{ maxLength: 64 }}
                        />
                        <Button
                            variant="outlined"
                            onClick={() => {
                                post("preOrders.batches.store", preOrder, { label: label || null });
                                setLabel("");
                            }}
                        >
                            Add another batch
                        </Button>
                        {can.close_batches && (
                            <Button
                                variant="contained"
                                onClick={() => post("preOrders.batches.close", preOrder)}
                            >
                                No more batches – proceed
                            </Button>
                        )}
                    </Stack>
                    {!can.close_batches && (
                        <Typography variant="caption" color="text.secondary">
                            BION closes the batches for this test; send them a message when the last
                            one is out.
                        </Typography>
                    )}
                </Box>
            )}
        </Paper>
    );
}

BatchesCard.propTypes = {
    preOrder: PropTypes.object.isRequired,
    orders: PropTypes.array.isRequired,
    canAct: PropTypes.bool,
};
