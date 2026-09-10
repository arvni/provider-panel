import React, { useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    Stack,
    Switch,
    Tooltip,
    Typography,
    alpha,
    useMediaQuery,
    useTheme,
} from "@mui/material";

const CHANNELS = [
    { key: "database", label: "In-app", hint: "Shows in the notification bell" },
    { key: "mail", label: "Email", hint: "Sent to your email address" },
];

/**
 * The In-app / Email switches for one row, whether that row is a whole
 * notification type or a single status within one.
 */
const SwitchCluster = ({ target, label, isMobile, onToggle }) => (
    <Box
        sx={{
            display: "flex",
            justifyContent: isMobile ? "flex-start" : "flex-end",
            gap: isMobile ? 2 : 0,
        }}
    >
        {CHANNELS.map(({ key, label: channelLabel }) => (
            <Box
                key={key}
                sx={{
                    width: isMobile ? "auto" : 88,
                    display: "flex",
                    flexDirection: isMobile ? "row" : "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: isMobile ? 0.5 : 0,
                }}
            >
                {isMobile && (
                    <Typography variant="caption" color="text.secondary">
                        {channelLabel}
                    </Typography>
                )}
                {target.channels[key].supported ? (
                    <Switch
                        size="small"
                        checked={target.channels[key].enabled}
                        onChange={() => onToggle(key)}
                        inputProps={{ "aria-label": `${label} — ${channelLabel}` }}
                    />
                ) : (
                    <Tooltip
                        title={`This notification is never sent by ${channelLabel.toLowerCase()}`}
                    >
                        <Typography variant="body2" color="text.disabled" sx={{ px: 1 }}>
                            —
                        </Typography>
                    </Tooltip>
                )}
            </Box>
        ))}
    </Box>
);

/**
 * The notification matrix: one row per notification type, one switch per channel.
 *
 * Holds the whole matrix in state and submits it entire rather than saving each
 * switch as it flips. A row per request would leave a half-applied screen behind
 * whenever one of them failed, and the server treats a save as a replacement of
 * everything the user may configure.
 */
const NotificationPreferencesForm = ({
    preferences,
    onSubmit,
    processing = false,
    description = null,
    children = null,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [rows, setRows] = useState(preferences);
    const [baseline, setBaseline] = useState(preferences);

    // Whatever the server last said is the truth to compare against. Every
    // Inertia response hands over a fresh array, so this resets the switches
    // after a save and -- the case that would otherwise bite -- when an admin
    // moves from one user's screen to another's without the page remounting.
    if (preferences !== baseline) {
        setBaseline(preferences);
        setRows(preferences);
    }

    // Preserve the order the server sent; group headings appear where they first do.
    const groups = useMemo(() => {
        const byGroup = new Map();

        rows.forEach((row) => {
            if (!byGroup.has(row.group)) byGroup.set(row.group, []);
            byGroup.get(row.group).push(row);
        });

        return [...byGroup.entries()];
    }, [rows]);

    const dirty = useMemo(
        () =>
            rows.some((row, index) => {
                const before = baseline[index];
                const changed = ({ key }, a, b) =>
                    a.channels[key].enabled !== b.channels[key].enabled;

                return (
                    CHANNELS.some((channel) => changed(channel, row, before)) ||
                    row.variants.some((variant, variantIndex) =>
                        CHANNELS.some((channel) =>
                            changed(channel, variant, before.variants[variantIndex])
                        )
                    )
                );
            }),
        [rows, baseline]
    );

    const flip = (target, channel) => ({
        ...target,
        channels: {
            ...target.channels,
            [channel]: { ...target.channels[channel], enabled: !target.channels[channel].enabled },
        },
    });

    // variantKey null addresses the type's own switches; otherwise one of its rows.
    const toggle = (type, variantKey, channel) =>
        setRows((current) =>
            current.map((row) => {
                if (row.type !== type) return row;

                return variantKey === null
                    ? flip(row, channel)
                    : {
                          ...row,
                          variants: row.variants.map((variant) =>
                              variant.key === variantKey ? flip(variant, channel) : variant
                          ),
                      };
            })
        );

    // Only supported channels are submitted; the server ignores the rest anyway,
    // and sending them would imply a switch the notification does not have.
    const answersFor = (row, target, variantKey) =>
        CHANNELS.filter(({ key }) => target.channels[key].supported).map(({ key }) => ({
            type: row.type,
            variant: variantKey,
            channel: key,
            enabled: target.channels[key].enabled,
        }));

    const handleSubmit = () =>
        onSubmit(
            rows.flatMap((row) =>
                row.variants.length === 0
                    ? answersFor(row, row, "")
                    : row.variants.flatMap((variant) => answersFor(row, variant, variant.key))
            )
        );

    const handleReset = () => setRows(baseline);

    return (
        <Stack spacing={3}>
            {description && (
                <Typography variant="body2" color="text.secondary">
                    {description}
                </Typography>
            )}

            {groups.map(([group, groupRows]) => (
                <Card key={group} variant="outlined">
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            {group}
                        </Typography>

                        {/* Channel headings, desktop only: on a narrow screen each
                            switch carries its own label instead. */}
                        {!isMobile && (
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    pb: 1,
                                }}
                            >
                                <Box sx={{ flexGrow: 1 }} />
                                {CHANNELS.map(({ key, label, hint }) => (
                                    <Tooltip key={key} title={hint}>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ width: 88, textAlign: "center" }}
                                        >
                                            {label}
                                        </Typography>
                                    </Tooltip>
                                ))}
                            </Box>
                        )}

                        <Divider />

                        {groupRows.map((row, index) => (
                            <Box key={row.type}>
                                {index > 0 && <Divider />}
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: isMobile ? "column" : "row",
                                        alignItems: isMobile ? "stretch" : "center",
                                        gap: isMobile ? 1 : 0,
                                        py: 1.5,
                                    }}
                                >
                                    <Box sx={{ flexGrow: 1, pr: 2 }}>
                                        <Typography variant="body2" fontWeight={500}>
                                            {row.label}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {row.description}
                                        </Typography>
                                    </Box>

                                    {/* A type that splits into statuses carries no switches of
                                        its own -- the rows beneath it do, and a master switch
                                        here would only raise the question of which one wins. */}
                                    {row.variants.length === 0 && (
                                        <SwitchCluster
                                            target={row}
                                            label={row.label}
                                            isMobile={isMobile}
                                            onToggle={(channel) => toggle(row.type, null, channel)}
                                        />
                                    )}
                                </Box>

                                {row.variants.length > 0 && (
                                    <Box sx={{ pb: 1 }}>
                                        {row.variants.map((variant) => (
                                            <Box
                                                key={variant.key}
                                                sx={{
                                                    display: "flex",
                                                    flexDirection: isMobile ? "column" : "row",
                                                    alignItems: isMobile ? "stretch" : "center",
                                                    gap: isMobile ? 0.5 : 0,
                                                    py: 0.75,
                                                    pl: 2,
                                                    borderLeft: "2px solid",
                                                    borderColor: theme.palette.divider,
                                                    ml: 1,
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ flexGrow: 1, pr: 2 }}
                                                >
                                                    {variant.label}
                                                </Typography>
                                                <SwitchCluster
                                                    target={variant}
                                                    label={`${row.label} — ${variant.label}`}
                                                    isMobile={isMobile}
                                                    onToggle={(channel) =>
                                                        toggle(row.type, variant.key, channel)
                                                    }
                                                />
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </CardContent>
                </Card>
            ))}

            {children}

            <Box
                sx={{
                    position: "sticky",
                    bottom: 0,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 1,
                    py: 2,
                    backgroundColor: alpha(theme.palette.background.default, 0.9),
                    backdropFilter: "blur(4px)",
                }}
            >
                <Button onClick={handleReset} disabled={!dirty || processing}>
                    Reset
                </Button>
                <Button variant="contained" onClick={handleSubmit} disabled={!dirty || processing}>
                    Save changes
                </Button>
            </Box>
        </Stack>
    );
};

export default NotificationPreferencesForm;
