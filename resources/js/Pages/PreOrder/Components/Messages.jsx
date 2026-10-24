import React from "react";
import PropTypes from "prop-types";
import { useForm } from "@inertiajs/react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { when } from "./stage";

/** Messages with BION. Plain text only: nothing here is ever rendered as markup. */
export default function Messages({ preOrderId, history, canMessage }) {
    const messages = history.filter((h) => h.type === "comment");
    const { data, setData, post, processing, errors, reset } = useForm({ body: "" });

    const send = () =>
        post(route("preOrders.message", preOrderId), {
            preserveScroll: true,
            onSuccess: () => reset("body"),
        });

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1.5}>
                {messages.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        No messages yet.
                    </Typography>
                )}
                {messages.map((m, i) => (
                    <Box
                        key={i}
                        sx={{
                            p: 1.5,
                            borderRadius: 1,
                            border: 1,
                            borderColor: "divider",
                            bgcolor: m.side === "bion" ? "action.hover" : "background.paper",
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            {m.side === "bion" ? "BION" : (m.actor_name ?? "You")} ·{" "}
                            {when(m.created_at)}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {m.body}
                        </Typography>
                    </Box>
                ))}
            </Stack>
            {canMessage && (
                <Stack spacing={1} sx={{ mt: 2 }}>
                    <TextField
                        multiline
                        minRows={2}
                        label="Message to BION"
                        value={data.body}
                        onChange={(e) => setData("body", e.target.value)}
                        error={Boolean(errors.body)}
                        helperText={errors.body}
                        inputProps={{ maxLength: 5000 }}
                    />
                    <Button
                        variant="contained"
                        size="small"
                        sx={{ alignSelf: "flex-start" }}
                        onClick={send}
                        disabled={processing || !data.body.trim()}
                    >
                        Send
                    </Button>
                </Stack>
            )}
        </Paper>
    );
}

Messages.propTypes = {
    preOrderId: PropTypes.number.isRequired,
    history: PropTypes.array.isRequired,
    canMessage: PropTypes.bool,
};
