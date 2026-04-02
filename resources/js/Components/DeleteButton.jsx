import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    IconButton,
    Tooltip,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import React, { useState } from "react";
import { useDelete } from "@/Services/api";

const DeleteButton = ({ url, onConfirm, size = "medium", disabled = false, IconProps = {}, tooltip = "Delete" }) => {
    const [open, setOpen] = useState(false);
    const { submit, processing } = useDelete();

    const handleConfirm = () => {
        setOpen(false);
        if (onConfirm) onConfirm();
        else if (url) submit(url);
    };

    return (
        <>
            <Tooltip title={tooltip}>
                <span>
                    <IconButton
                        color="error"
                        size={size}
                        disabled={disabled || processing}
                        onClick={() => setOpen(true)}
                        aria-label="delete"
                    >
                        {processing ? <CircularProgress size={size === "small" ? 16 : 20} color="error" /> : <DeleteIcon {...IconProps} />}
                    </IconButton>
                </span>
            </Tooltip>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this item? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setOpen(false)} variant="outlined" size="small">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} color="error" variant="contained" size="small" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default DeleteButton;
