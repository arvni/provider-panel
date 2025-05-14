import { Grid, Container, Paper, Typography, Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import logo from "@/../images/logo.png";
import { motion } from "framer-motion";

export default function GuestLayout({ children }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.5,
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
    };

    return (
        <Container
            component={motion.div}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                py: 4, // padding top and bottom
                maxWidth: "900px !important"
            }}
        >
            <Paper
                component={motion.div}
                variants={itemVariants}
                elevation={3}
                sx={{
                    width: "100%",
                    p: { xs: 3, sm: 4, md: 5 }, // Responsive padding
                    borderRadius: "16px",
                    bgcolor: "#f8f9fa",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
                    overflow: "hidden",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                        boxShadow: "0 12px 48px rgba(0, 0, 0, 0.12)",
                        transform: "translateY(-4px)"
                    }
                }}
            >
                <Grid
                    container
                    spacing={{ xs: 3, md: 5 }}
                    direction="row"
                    alignItems="center"
                >
                    <Grid
                        item
                        xs={12}
                        md={5}
                        component={motion.div}
                        variants={itemVariants}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textAlign: "center",
                            gap: 3
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
                                filter: "drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.1))"
                            }}
                        />

                        <Typography
                            variant="h1"
                            sx={{
                                fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                                fontWeight: 700,
                                color: "#2a3990", // A professional blue color
                                letterSpacing: "-0.5px",
                                position: "relative",
                                "&::after": {
                                    content: '""',
                                    position: "absolute",
                                    bottom: "-8px",
                                    left: "50%",
                                    width: "40px",
                                    height: "3px",
                                    backgroundColor: "#2a3990",
                                    transform: "translateX(-50%)"
                                }
                            }}
                        >
                            Provider Panel
                        </Typography>

                        {isMobile && (
                            <Box sx={{ width: "100%", borderBottom: "1px solid #e0e0e0", my: 2 }} />
                        )}
                    </Grid>

                    <Grid
                        item
                        xs={12}
                        md={7}
                        component={motion.div}
                        variants={itemVariants}
                    >
                        <Box
                            sx={{
                                height: "100%",
                                p: { xs: 1, sm: 2 },
                                borderRadius: "8px",
                                position: "relative"
                            }}
                        >
                            {children}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
}
