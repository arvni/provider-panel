import React from "react";
import { Box, Stack, Typography, alpha, useTheme } from "@mui/material";
import Actions from "./Actions";

const PageHeader = ({ title, subtitle = "", actions = [] }) => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 2,
                mb: 3,
                pb: 2,
                borderBottom: "1px solid",
                borderColor: theme.palette.divider,
            }}
        >
            <Stack spacing={0.5}>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        lineHeight: 1.2,
                    }}
                >
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
            </Stack>

            {actions?.length > 0 && <Actions actions={actions} />}
        </Box>
    );
};

export default PageHeader;
