import React from "react";
import { Typography, Box, Link, Tooltip, useTheme } from "@mui/material";
import { motion } from "framer-motion";

/**
 * Enhanced Copyright component with better visual design and information
 *
 * @param company
 * @param showLinks
 * @param variant
 * @param {object} props - Component props including optional company info and links
 * @returns {JSX.Element} - Rendered Copyright component
 */
const Copyright = ({
                       company = "Bion Genetic Lab",
                       showLinks = true,
                       variant = "body2",
                       ...props
                   }) => {
    const currentYear = new Date().getFullYear();

    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'center',
                alignItems: 'center',
                gap: { xs: 1, sm: 2 },
                width: '100%',
                py: 1.5,
                ...props.sx
            }}
        >
            <Typography
                variant={variant}
                color="text.secondary"
                align="center"
                sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    lineHeight: 1.5,
                    letterSpacing: '0.01em',
                }}
            >
                &copy; {currentYear} {company}. All rights reserved.
            </Typography>

            {showLinks && (
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: { xs: 1.5, sm: 2 },
                        '&::before': {
                            content: { xs: 'none', sm: '""' },
                            display: 'block',
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: 'text.disabled',
                        }
                    }}
                >
                    <FooterLink href="#privacy">Privacy Policy</FooterLink>
                    <FooterLink href="#terms">Terms of Service</FooterLink>
                    <FooterLink href="#contact">Contact Us</FooterLink>
                </Box>
            )}
        </Box>
    );
};

/**
 * Footer link component with hover effect
 */
const FooterLink = ({ href, children }) => {
    const theme = useTheme();

    return (
        <Tooltip title={children} enterDelay={500}>
            <Link
                href={href}
                color="text.secondary"
                underline="none"
                sx={{
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    px: 0.5,
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -2,
                        left: 0,
                        width: '0%',
                        height: '1px',
                        backgroundColor: theme.palette.primary.main,
                        transition: 'width 0.3s ease',
                    },
                    '&:hover': {
                        color: theme.palette.primary.main,
                        '&::after': {
                            width: '100%',
                        }
                    },
                }}
            >
                {children}
            </Link>
        </Tooltip>
    );
};

export default Copyright;
