import React, { useState, useMemo } from "react";
import {
    Grid,
    Container,
    Paper,
    Typography,
    Box,
    useMediaQuery,
    IconButton,
    Tooltip,
} from "@mui/material";
import { createTheme, ThemeProvider, useTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import logo from "@/../images/logo.png";
import { motion } from "framer-motion";

const COLOR_MODE_KEY = "color-mode";

function readStoredMode() {
    try {
        return localStorage.getItem(COLOR_MODE_KEY) || "light";
    } catch {
        return "light";
    }
}

function saveMode(mode) {
    try {
        localStorage.setItem(COLOR_MODE_KEY, mode);
    } catch {}
}

// Inner component — consumes the theme provided below
function GuestContent({ children, colorMode, onToggle }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.5, when: "beforeChildren", staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "background.default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                transition: "background-color 0.3s",
            }}
        >
            {/* Theme toggle — top-right corner */}
            <Box sx={{ position: "fixed", top: 16, right: 16, zIndex: 10 }}>
                <Tooltip title={colorMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                    <IconButton
                        onClick={onToggle}
                        size="small"
                        sx={{
                            bgcolor: "background.paper",
                            border: "1px solid",
                            borderColor: "divider",
                            boxShadow: 2,
                            "&:hover": { bgcolor: "action.hover" },
                        }}
                    >
                        {colorMode === "dark" ? (
                            <Brightness7Icon fontSize="small" />
                        ) : (
                            <Brightness4Icon fontSize="small" />
                        )}
                    </IconButton>
                </Tooltip>
            </Box>

            <Container
                component={motion.div}
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 4,
                    maxWidth: "900px !important",
                }}
            >
                <Paper
                    component={motion.div}
                    variants={itemVariants}
                    elevation={3}
                    sx={{
                        width: "100%",
                        p: { xs: 3, sm: 4, md: 5 },
                        borderRadius: "16px",
                        bgcolor: "background.paper",
                        boxShadow: colorMode === "dark"
                            ? "0 8px 32px rgba(0,0,0,0.4)"
                            : "0 8px 32px rgba(0,0,0,0.08)",
                        overflow: "hidden",
                        transition: "all 0.3s ease-in-out",
                        "&:hover": {
                            boxShadow: colorMode === "dark"
                                ? "0 12px 48px rgba(0,0,0,0.5)"
                                : "0 12px 48px rgba(0,0,0,0.12)",
                            transform: "translateY(-4px)",
                        },
                    }}
                >
                    <Grid
                        container
                        spacing={{ xs: 3, md: 5 }}
                        direction="row"
                        alignItems="center"
                    >
                        {/* Left panel — logo */}
                        <Grid
                            size={{ xs: 12, md: 5 }}
                            component={motion.div}
                            variants={itemVariants}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                textAlign: "center",
                                gap: 3,
                            }}
                        >
                            <Box
                                component="img"
                                src={logo}
                                alt="Bion Genetic Lab"
                                sx={{
                                    width: { xs: "70%", sm: "80%", md: "90%" },
                                    maxWidth: "250px",
                                    height: "auto",
                                    filter: colorMode === "dark"
                                        ? "drop-shadow(0px 4px 12px rgba(0,0,0,0.5)) brightness(0.95)"
                                        : "drop-shadow(0px 4px 8px rgba(0,0,0,0.1))",
                                }}
                            />

                            <Typography
                                variant="h1"
                                sx={{
                                    fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                                    fontWeight: 700,
                                    color: "primary.main",
                                    letterSpacing: "-0.5px",
                                    position: "relative",
                                    "&::after": {
                                        content: '""',
                                        position: "absolute",
                                        bottom: "-8px",
                                        left: "50%",
                                        width: "40px",
                                        height: "3px",
                                        backgroundColor: "primary.main",
                                        transform: "translateX(-50%)",
                                    },
                                }}
                            >
                                Provider Panel
                            </Typography>

                            {isMobile && (
                                <Box
                                    sx={{
                                        width: "100%",
                                        borderBottom: "1px solid",
                                        borderColor: "divider",
                                        my: 2,
                                    }}
                                />
                            )}
                        </Grid>

                        {/* Right panel — form */}
                        <Grid
                            size={{ xs: 12, md: 7 }}
                            component={motion.div}
                            variants={itemVariants}
                        >
                            <Box
                                sx={{
                                    height: "100%",
                                    p: { xs: 1, sm: 2 },
                                    borderRadius: "8px",
                                    position: "relative",
                                }}
                            >
                                {children}
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </Box>
    );
}

export default function GuestLayout({ children }) {
    const [colorMode, setColorMode] = useState(readStoredMode);

    const handleToggle = () => {
        const next = colorMode === "dark" ? "light" : "dark";
        setColorMode(next);
        saveMode(next);
    };

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: colorMode,
                    primary: { main: "#2a3990" },
                    secondary: { main: "#42a5f5" },
                    background: {
                        default: colorMode === "dark" ? "#121212" : "#f5f7fa",
                        paper: colorMode === "dark" ? "#1e1e1e" : "#ffffff",
                    },
                },
                typography: {
                    fontFamily: [
                        "Montserrat", "-apple-system", "BlinkMacSystemFont",
                        "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif",
                    ].join(","),
                },
                shape: { borderRadius: 8 },
            }),
        [colorMode]
    );

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <GuestContent colorMode={colorMode} onToggle={handleToggle}>
                {children}
            </GuestContent>
        </ThemeProvider>
    );
}
