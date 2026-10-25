import React from "react";
import PropTypes from "prop-types";
import { useForm } from "@inertiajs/react";
import { Box, Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import { when } from "./stage";

const STATUS_LABEL = {
    open: "open",
    answered: "answered",
    awaiting_finance: "waiting for your approval",
    order_created: "order to place",
    closed: "closed",
    declined: "declined",
};

/**
 * A request from BION. While it is open the center answers it here; an additional-test request
 * carries its own quotation (passed as children).
 */
export default function RequestCard({ preOrderId, request, canAct, children }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        request: request.number,
        answer: "",
    });
    const open = request.status === "open";

    const send = () =>
        post(route("preOrders.answer", preOrderId), {
            preserveScroll: true,
            onSuccess: () => reset("answer"),
        });

    return (
        <Paper variant="outlined" sx={{ p: 2, borderColor: open ? "warning.main" : "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography fontWeight={600}>{request.label}</Typography>
                <Chip
                    size="small"
                    color={open || request.status === "awaiting_finance" ? "warning" : "default"}
                    label={STATUS_LABEL[request.status] ?? request.status}
                />
                {request.blocking && open && (
                    <Chip
                        size="small"
                        color="error"
                        variant="outlined"
                        label="BION is waiting on this"
                    />
                )}
                {request.due_at && (
                    <Typography variant="caption" color="text.secondary">
                        due {new Date(request.due_at).toLocaleDateString()}
                    </Typography>
                )}
            </Stack>
            <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                {request.message}
            </Typography>
            {request.answer && (
                <Box sx={{ mt: 1, p: 1, bgcolor: "action.hover", borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        Your answer · {when(request.answered_at)}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {request.answer}
                    </Typography>
                </Box>
            )}
            {children && <Box sx={{ mt: 2 }}>{children}</Box>}
            {open && canAct && (
                <Stack spacing={1} sx={{ mt: 2 }}>
                    <TextField
                        multiline
                        minRows={2}
                        label="Your answer"
                        value={data.answer}
                        onChange={(e) => setData("answer", e.target.value)}
                        error={Boolean(errors.answer)}
                        helperText={errors.answer}
                        inputProps={{ maxLength: 5000 }}
                    />
                    <Button
                        variant="contained"
                        size="small"
                        sx={{ alignSelf: "flex-start" }}
                        onClick={send}
                        disabled={processing || !data.answer.trim()}
                    >
                        Send answer
                    </Button>
                </Stack>
            )}
        </Paper>
    );
}

RequestCard.propTypes = {
    preOrderId: PropTypes.number.isRequired,
    request: PropTypes.object.isRequired,
    canAct: PropTypes.bool,
    children: PropTypes.node,
};
