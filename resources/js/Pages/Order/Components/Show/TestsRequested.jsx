import React from "react";
import { Box, Chip, Typography } from "@mui/material";
import { Science as ScienceIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import { itemVariants } from "@/Pages/Order/Components/orderMotion";

/**
 * "Analysis Requested" — the list of test chips on the Order Show page.
 */
const TestsRequested = ({ tests = [] }) => (
    <Box
        component={motion.div}
        variants={itemVariants}
        sx={{
            mb: 4,
            "@media print": {
                marginBottom: "3mm !important",
                pageBreakInside: "avoid",
            },
        }}
    >
        <Typography
            variant="h6"
            fontWeight={600}
            sx={{
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
                "@media print": {
                    fontSize: "10px !important",
                    fontWeight: "bold !important",
                    marginBottom: "2mm !important",
                    color: "#000 !important",
                },
            }}
        >
            <ScienceIcon
                color="primary"
                sx={{
                    "@media print": {
                        display: "none !important",
                    },
                }}
            />
            Analysis Requested
        </Typography>

        <Box
            sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                ml: 4,
                "@media print": {
                    marginLeft: "0 !important",
                    gap: "1mm !important",
                },
            }}
        >
            {tests.map((test, index) => (
                <Chip
                    key={index}
                    label={test.name}
                    color="primary"
                    variant="outlined"
                    sx={{
                        fontWeight: 500,
                        borderRadius: 1,
                        height: 32,
                        "@media print": {
                            fontSize: "7px !important",
                            height: "auto !important",
                            padding: "1mm !important",
                            border: "1px solid #000 !important",
                            borderRadius: "2px !important",
                            backgroundColor: "#f5f5f5 !important",
                            color: "#000 !important",
                        },
                    }}
                />
            ))}
        </Box>
    </Box>
);

export default TestsRequested;
