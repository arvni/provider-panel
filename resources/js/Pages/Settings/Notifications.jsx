import React, { useState } from "react";
import { router } from "@inertiajs/react";
import {
    Box,
    Card,
    CardContent,
    Container,
    Divider,
    Switch,
    Typography,
} from "@mui/material";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import NotificationPreferencesForm from "@/Pages/Settings/Components/NotificationPreferencesForm";
import { useNotifications } from "@/Layouts/Components/Notification/NotificationsProvider";
import { soundManager } from "@/Layouts/Components/Notification/utils/soundManager";

/**
 * This browser's own notification behaviour.
 *
 * Kept apart from the saved preferences above it, and labelled as such: these
 * two live in localStorage and in a browser permission, so they follow the
 * device rather than the account. Surfacing them here is the only place a user
 * can find them at all -- until now they existed solely as an icon in the
 * notification panel.
 */
const DeviceSettings = () => {
    const { desktopEnabled, toggleDesktopNotifications } = useNotifications();
    const [soundEnabled, setSoundEnabled] = useState(() => soundManager.isSoundEnabled());

    const rows = [
        {
            label: "Desktop notifications",
            description:
                "Pop a system notification when something arrives while this tab is in the background.",
            checked: desktopEnabled,
            onChange: () => toggleDesktopNotifications(),
        },
        {
            label: "Notification sound",
            description: "Play a short sound when a new notification arrives.",
            checked: soundEnabled,
            onChange: () => setSoundEnabled(soundManager.toggleSound()),
        },
    ];

    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="subtitle1" fontWeight={600}>
                    This browser
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Saved on this device only, not to your account.
                </Typography>

                <Divider sx={{ mt: 1.5 }} />

                {rows.map((row, index) => (
                    <Box key={row.label}>
                        {index > 0 && <Divider />}
                        <Box sx={{ display: "flex", alignItems: "center", py: 1.5 }}>
                            <Box sx={{ flexGrow: 1, pr: 2 }}>
                                <Typography variant="body2" fontWeight={500}>
                                    {row.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {row.description}
                                </Typography>
                            </Box>
                            <Switch
                                size="small"
                                checked={row.checked}
                                onChange={row.onChange}
                                inputProps={{ "aria-label": row.label }}
                            />
                        </Box>
                    </Box>
                ))}
            </CardContent>
        </Card>
    );
};

const Notifications = ({ preferences }) => {
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (next) =>
        router.put(
            route("settings.notifications.update"),
            { preferences: next },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            }
        );

    return (
        <Container sx={{ py: 2 }}>
            <NotificationPreferencesForm
                preferences={preferences}
                onSubmit={handleSubmit}
                processing={processing}
                description="Choose what you hear about and how. Sign-in codes and account emails are always sent."
            >
                <DeviceSettings />
            </NotificationPreferencesForm>
        </Container>
    );
};

const breadCrumbs = [
    {
        title: "Notification settings",
        link: null,
        icon: null,
    },
];

Notifications.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Notifications;
