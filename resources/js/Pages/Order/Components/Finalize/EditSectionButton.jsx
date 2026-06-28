import React from "react";
import { Box, Button } from "@mui/material";

/**
 * Right-aligned "Edit …" link that jumps back to a given order edit step.
 * Repeated at the foot of every Finalize review section.
 */
const EditSectionButton = ({ orderId, step, label }) => (
    <Box sx={{ mt: 2, textAlign: "right" }}>
        <Button
            variant="outlined"
            size="small"
            component="a"
            href={route("orders.edit", { order: orderId, step })}
            sx={{
                borderRadius: 2,
                textTransform: "none",
            }}
        >
            {label}
        </Button>
    </Box>
);

export default EditSectionButton;
