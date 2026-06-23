import React, { useEffect, useRef } from "react";
import { Box, Fade, FormHelperText, useMediaQuery, useTheme } from "@mui/material";

/**
 * Cloudflare Turnstile widget, matching the implementation used on the login
 * form. Reports its token through `onToken` and exposes a `widgetRef` so the
 * parent can reset the widget after a failed submit.
 */
const TurnstileWidget = ({ siteKey, error, onToken, widgetRef }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);

    useEffect(() => {
        if (!siteKey) return;

        const renderWidget = () => {
            if (!containerRef.current) return;
            // Remove any existing widget before rendering a new one
            if (widgetIdRef.current !== null && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                theme: "light",
                callback: (token) => onToken(token),
                "expired-callback": () => onToken(""),
                "error-callback": () => onToken(""),
            });

            if (widgetRef) {
                widgetRef.current = () => {
                    if (window.turnstile && widgetIdRef.current !== null) {
                        window.turnstile.reset(widgetIdRef.current);
                    }
                    onToken("");
                };
            }
        };

        const cleanup = () => {
            if (widgetIdRef.current !== null && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };

        // Reuse existing script if already loaded
        if (window.turnstile) {
            renderWidget();
            return cleanup;
        }

        const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
        if (existingScript) {
            existingScript.addEventListener("load", renderWidget);
            return () => existingScript.removeEventListener("load", renderWidget);
        }

        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = renderWidget;
        document.body.appendChild(script);

        return cleanup;
    }, [siteKey]);

    if (!siteKey) return null;

    return (
        <Box
            sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mt: 1,
                mb: 1,
            }}
        >
            <Box
                ref={containerRef}
                sx={{
                    transform: isMobile ? "scale(0.85)" : "scale(1)",
                    transformOrigin: "left",
                    minHeight: "65px",
                    width: "100%",
                }}
            />
            {error && (
                <Fade in={!!error}>
                    <FormHelperText error sx={{ textAlign: "center", mt: 1, fontSize: "0.75rem" }}>
                        {error}
                    </FormHelperText>
                </Fade>
            )}
        </Box>
    );
};

export default TurnstileWidget;
