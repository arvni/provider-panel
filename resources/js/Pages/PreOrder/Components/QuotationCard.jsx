import React, { useState } from "react";
import PropTypes from "prop-types";
import { useForm } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Checkbox,
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
import { when } from "./stage";

const STATUS_COLOR = {
    awaiting_center: "warning",
    approved: "success",
    partially_approved: "info",
    rejected: "error",
    expired: "error",
    revision_required: "default",
};

/**
 * One quotation from BION. Its prices come from BION's catalogue; the center's approver approves
 * it, keeps some of its lines, or rejects it with a reason. Nothing goes to the lab until then.
 */
export default function QuotationCard({ preOrderId, quotation, patientName, canApprove }) {
    const open = quotation.status === "awaiting_center";
    const [mode, setMode] = useState("approve");
    const { data, setData, post, processing, errors, transform } = useForm({
        quotation: quotation.number,
        decision: "approve",
        items: quotation.lines.map((l) => l.id),
        note: "",
        center_reference: "",
    });

    transform((form) => ({
        quotation: form.quotation,
        decision: mode,
        items: mode === "partial" ? form.items : null,
        note: form.note || null,
        center_reference: form.center_reference || null,
    }));

    const toggleLine = (id, checked) =>
        setData("items", checked ? [...data.items, id] : data.items.filter((i) => i !== id));

    const keptAll = data.items.length === quotation.lines.length;
    const ready =
        mode === "approve" ||
        (mode === "partial" && data.items.length > 0 && !keptAll) ||
        (mode === "reject" && data.note.trim() !== "");

    const send = () =>
        post(route("preOrders.finance.decide", preOrderId), { preserveScroll: true });

    return (
        <Paper variant="outlined" sx={{ p: 2, borderColor: open ? "warning.main" : "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography fontWeight={600}>Quotation {quotation.number}</Typography>
                <Chip
                    size="small"
                    color={STATUS_COLOR[quotation.status] ?? "default"}
                    label={quotation.status_label}
                />
                {quotation.pdf && (
                    <Button
                        size="small"
                        href={route("preOrders.documents.show", [preOrderId, quotation.pdf])}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Download PDF
                    </Button>
                )}
                {open && quotation.expires_at && (
                    <Typography variant="caption" color="text.secondary">
                        valid until {new Date(quotation.expires_at).toLocaleDateString()}
                    </Typography>
                )}
            </Stack>
            {quotation.reason && (
                <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                    {quotation.reason}
                </Typography>
            )}
            <Table size="small" sx={{ mt: 1 }}>
                <TableHead>
                    <TableRow>
                        {open && canApprove && mode === "partial" && (
                            <TableCell padding="checkbox" />
                        )}
                        <TableCell>Test</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {quotation.lines.map((line) => (
                        <TableRow key={line.id}>
                            {open && canApprove && mode === "partial" && (
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={data.items.includes(line.id)}
                                        onChange={(e) => toggleLine(line.id, e.target.checked)}
                                        inputProps={{ "aria-label": `Keep ${line.test_name}` }}
                                    />
                                </TableCell>
                            )}
                            <TableCell>{line.test_name}</TableCell>
                            <TableCell>{patientName(line.patient_ref)}</TableCell>
                            <TableCell align="right">{line.qty}</TableCell>
                            <TableCell align="right">{line.unit_price}</TableCell>
                            <TableCell align="right">{line.line_total}</TableCell>
                        </TableRow>
                    ))}
                    {Number(quotation.discount) > 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={open && canApprove && mode === "partial" ? 5 : 4}
                                align="right"
                            >
                                Discount
                            </TableCell>
                            <TableCell align="right">−{quotation.discount}</TableCell>
                        </TableRow>
                    )}
                    <TableRow>
                        <TableCell
                            colSpan={open && canApprove && mode === "partial" ? 5 : 4}
                            align="right"
                        >
                            <strong>Total</strong>
                        </TableCell>
                        <TableCell align="right">
                            <strong>{quotation.total}</strong>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            {quotation.decided_at && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                    {quotation.status_label} by {quotation.decided_by ?? "your center"} ·{" "}
                    {when(quotation.decided_at)}
                    {quotation.approved_amount !== null &&
                        quotation.status !== "rejected" &&
                        ` · approved ${quotation.approved_amount}`}
                    {quotation.center_reference && ` · your ref. ${quotation.center_reference}`}
                    {quotation.note && ` — “${quotation.note}”`}
                </Typography>
            )}

            {open && !canApprove && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Waiting for your center&apos;s approver. Only users allowed to approve costs can
                    approve or reject this; ask your account admin if that should be you.
                </Alert>
            )}

            {open && canApprove && (
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                    <ToggleButtonGroup
                        exclusive
                        size="small"
                        value={mode}
                        onChange={(_, v) => v && setMode(v)}
                    >
                        <ToggleButton value="approve">Approve</ToggleButton>
                        <ToggleButton value="partial" disabled={quotation.lines.length < 2}>
                            Partly approve
                        </ToggleButton>
                        <ToggleButton value="reject">Reject</ToggleButton>
                    </ToggleButtonGroup>
                    {mode === "partial" && (
                        <Typography variant="caption" color="text.secondary">
                            Tick the lines to keep. BION reviews the rest with you before anything
                            goes to the lab.
                        </Typography>
                    )}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <TextField
                            size="small"
                            label="Your reference (optional)"
                            helperText={errors.center_reference || "e.g. internal purchase order"}
                            error={Boolean(errors.center_reference)}
                            value={data.center_reference}
                            onChange={(e) => setData("center_reference", e.target.value)}
                            inputProps={{ maxLength: 64 }}
                        />
                        <TextField
                            size="small"
                            fullWidth
                            label={mode === "reject" ? "Reason (required)" : "Note (optional)"}
                            value={data.note}
                            onChange={(e) => setData("note", e.target.value)}
                            error={Boolean(errors.note)}
                            helperText={errors.note}
                            inputProps={{ maxLength: 2000 }}
                        />
                    </Stack>
                    {(errors.quotation || errors.items || errors.decision) && (
                        <Alert severity="error">
                            {errors.quotation || errors.items || errors.decision}
                        </Alert>
                    )}
                    <Box>
                        <Button
                            variant="contained"
                            color={mode === "reject" ? "error" : "primary"}
                            onClick={send}
                            disabled={processing || !ready}
                        >
                            {mode === "approve"
                                ? `Approve ${quotation.total}`
                                : mode === "partial"
                                  ? "Approve ticked lines"
                                  : "Reject quotation"}
                        </Button>
                    </Box>
                </Stack>
            )}
        </Paper>
    );
}

QuotationCard.propTypes = {
    preOrderId: PropTypes.number.isRequired,
    quotation: PropTypes.object.isRequired,
    patientName: PropTypes.func.isRequired,
    canApprove: PropTypes.bool,
};
