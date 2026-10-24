import React from "react";
import PropTypes from "prop-types";
import { useForm } from "@inertiajs/react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Stack,
    TextField,
} from "@mui/material";

const REASONS = {
    hold: [
        ["patient_request", "The patient asked to wait"],
        ["cycle_postponed", "IVF cycle postponed"],
        ["awaiting_decision", "Waiting for the family's decision"],
        ["other", "Other"],
    ],
    cancel: [
        ["patient_withdrew", "The patient withdrew"],
        ["cycle_cancelled", "IVF cycle cancelled"],
        ["sent_elsewhere", "Sent to another lab"],
        ["duplicate", "Duplicate"],
        ["other", "Other"],
    ],
};

/** Ask BION to hold, or cancel the pre-order, with a reason. */
export default function ReasonDialog({ preOrderId, kind, onClose }) {
    const { data, setData, post, processing, errors } = useForm({ reason: "", comment: "" });

    const submit = () =>
        post(route(kind === "hold" ? "preOrders.hold" : "preOrders.cancel", preOrderId), {
            preserveScroll: true,
            onSuccess: onClose,
        });

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                {kind === "hold" ? "Ask BION to put this on hold" : "Cancel this pre-order"}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        select
                        label="Reason"
                        value={data.reason}
                        onChange={(e) => setData("reason", e.target.value)}
                        error={Boolean(errors.reason)}
                        helperText={errors.reason}
                    >
                        {REASONS[kind].map(([value, label]) => (
                            <MenuItem key={value} value={value}>
                                {label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        multiline
                        minRows={2}
                        label="Comment"
                        value={data.comment}
                        onChange={(e) => setData("comment", e.target.value)}
                        inputProps={{ maxLength: 2000 }}
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Back</Button>
                <Button
                    variant="contained"
                    color={kind === "cancel" ? "error" : "primary"}
                    onClick={submit}
                    disabled={processing || !data.reason}
                >
                    {kind === "hold" ? "Send" : "Cancel pre-order"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

ReasonDialog.propTypes = {
    preOrderId: PropTypes.number.isRequired,
    kind: PropTypes.oneOf(["hold", "cancel"]).isRequired,
    onClose: PropTypes.func.isRequired,
};
