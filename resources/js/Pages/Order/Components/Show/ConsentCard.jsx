import React from "react";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Grid,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Typography,
    useTheme,
    alpha,
} from "@mui/material";
import {
    Close,
    Done,
    Download as DownloadIcon,
    FileCopy as FileCopyIcon,
    FactCheck as FactCheckIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { itemVariants } from "@/Pages/Order/Components/orderMotion";

/**
 * Consent card on the Order Show page: lists each consent item with an
 * agreed/declined indicator, plus links to any uploaded consent form files.
 */
const ConsentCard = ({ restConsents, consentForm }) => {
    const theme = useTheme();

    return (
        <Card
            component={motion.div}
            variants={itemVariants}
            elevation={0}
            sx={{
                mb: 0,
                borderRadius: 2,
                border: "1px solid",
                borderColor: theme.palette.divider,
                overflow: "hidden",
                "@media print": {
                    border: "1px solid #000 !important",
                    borderRadius: "0 !important",
                    marginBottom: "0 !important",
                    backgroundColor: "#fff !important",
                    boxShadow: "none !important",
                    pageBreakInside: "avoid",
                },
            }}
        >
            <CardHeader
                title={
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            "@media print": {
                                gap: "1mm",
                            },
                        }}
                    >
                        <FactCheckIcon
                            sx={{
                                "@media print": {
                                    display: "none !important",
                                },
                            }}
                        />
                        <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{
                                "@media print": {
                                    fontSize: "10px !important",
                                    fontWeight: "bold !important",
                                    color: "#000 !important",
                                },
                            }}
                        >
                            Consent
                        </Typography>
                    </Box>
                }
                sx={{
                    py: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderBottom: "1px solid",
                    borderColor: theme.palette.divider,
                    "@media print": {
                        padding: "2mm !important",
                        backgroundColor: "#f5f5f5 !important",
                        borderBottom: "1px solid #000 !important",
                    },
                }}
            />

            <CardContent
                sx={{
                    p: { xs: 2, sm: 3 },
                    "@media print": {
                        padding: "2mm !important",
                    },
                }}
            >
                <Grid
                    container
                    spacing={2}
                    sx={{
                        "@media print": {
                            gap: "1mm !important",
                            margin: "0 !important",
                        },
                    }}
                >
                    <Grid size={12}>
                        <List
                            sx={{
                                p: 0,
                                "@media print": {
                                    padding: "0 !important",
                                },
                            }}
                        >
                            {restConsents?.map((consent, index) => (
                                <ListItem
                                    key={index}
                                    disablePadding
                                    sx={{
                                        py: 1,
                                        px: 0,
                                        borderBottom:
                                            index === restConsents.length - 1 &&
                                            !consentForm?.length
                                                ? "none"
                                                : `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                                        "@media print": {
                                            padding: "1mm 0 !important",
                                            borderBottom:
                                                index === restConsents.length - 1 &&
                                                !consentForm?.length
                                                    ? "none !important"
                                                    : "1px solid #ddd !important",
                                        },
                                    }}
                                >
                                    <ListItemAvatar
                                        sx={{
                                            minWidth: 45,
                                            "@media print": {
                                                minWidth: "8mm !important",
                                            },
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: consent?.value
                                                    ? alpha(theme.palette.success.main, 0.1)
                                                    : alpha(theme.palette.error.main, 0.1),
                                                color: consent?.value
                                                    ? theme.palette.success.main
                                                    : theme.palette.error.main,
                                                "@media print": {
                                                    width: "6mm !important",
                                                    height: "6mm !important",
                                                    backgroundColor: consent?.value
                                                        ? "#e8f5e8 !important"
                                                        : "#ffeaea !important",
                                                    color: consent?.value
                                                        ? "#2e7d32 !important"
                                                        : "#d32f2f !important",
                                                },
                                            }}
                                        >
                                            {consent?.value ? (
                                                <Done
                                                    sx={{
                                                        "@media print": {
                                                            fontSize: "3mm !important",
                                                        },
                                                    }}
                                                />
                                            ) : (
                                                <Close
                                                    sx={{
                                                        "@media print": {
                                                            fontSize: "3mm !important",
                                                        },
                                                    }}
                                                />
                                            )}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography
                                                variant="body2"
                                                fontWeight={500}
                                                sx={{
                                                    "@media print": {
                                                        fontSize: "7px !important",
                                                        fontWeight: "normal !important",
                                                        color: "#000 !important",
                                                    },
                                                }}
                                            >
                                                {consent?.title}
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                            ))}

                            {consentForm?.length > 0 && (
                                <ListItem
                                    disablePadding
                                    sx={{
                                        py: 2,
                                        "@media print": {
                                            padding: "2mm 0 !important",
                                        },
                                    }}
                                >
                                    <ListItemAvatar
                                        sx={{
                                            minWidth: 45,
                                            "@media print": {
                                                minWidth: "8mm !important",
                                            },
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                color: theme.palette.primary.main,
                                                "@media print": {
                                                    width: "6mm !important",
                                                    height: "6mm !important",
                                                    backgroundColor: "#e3f2fd !important",
                                                    color: "#1976d2 !important",
                                                },
                                            }}
                                        >
                                            <FileCopyIcon
                                                sx={{
                                                    "@media print": {
                                                        fontSize: "3mm !important",
                                                    },
                                                }}
                                            />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography
                                                variant="body2"
                                                fontWeight={600}
                                                sx={{
                                                    "@media print": {
                                                        fontSize: "7px !important",
                                                        fontWeight: "bold !important",
                                                        color: "#000 !important",
                                                    },
                                                }}
                                            >
                                                Consent Form
                                            </Typography>
                                        }
                                        secondary={
                                            <Box
                                                sx={{
                                                    mt: 1,
                                                    "@media print": {
                                                        marginTop: "1mm !important",
                                                    },
                                                }}
                                            >
                                                {consentForm?.map((item, index) => (
                                                    <Button
                                                        key={index}
                                                        href={"/files/" + item}
                                                        target="_blank"
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={
                                                            <DownloadIcon
                                                                sx={{
                                                                    "@media print": {
                                                                        display: "none !important",
                                                                    },
                                                                }}
                                                            />
                                                        }
                                                        sx={{
                                                            mr: 1,
                                                            mb: 1,
                                                            borderRadius: 1,
                                                            textTransform: "none",
                                                            "@media print": {
                                                                display: "inline-block !important",
                                                                fontSize: "6px !important",
                                                                padding: "1mm !important",
                                                                margin: "0.5mm !important",
                                                                border: "1px solid #000 !important",
                                                                borderRadius: "1mm !important",
                                                                backgroundColor:
                                                                    "#f5f5f5 !important",
                                                                color: "#000 !important",
                                                                textDecoration: "none !important",
                                                                minHeight: "auto !important",
                                                            },
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                "@media print": {
                                                                    fontSize: "6px !important",
                                                                },
                                                            }}
                                                        >
                                                            Form {index + 1}
                                                        </span>
                                                    </Button>
                                                ))}
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            )}
                        </List>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default ConsentCard;
