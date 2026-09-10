import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { Container } from "@mui/material";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import NotificationPreferencesForm from "@/Pages/Settings/Components/NotificationPreferencesForm";

/**
 * An admin editing someone else's notification switches. Same matrix as the
 * self-service screen, minus the device settings -- those live in that user's
 * own browser and cannot be set on their behalf.
 */
const NotificationPreferences = ({ user, preferences }) => {
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (next) =>
        router.put(
            route("admin.users.notifications.update", user.id),
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
                description={`Choose what ${user.name} hears about and how. Sign-in codes and account emails are always sent.`}
            />
        </Container>
    );
};

const breadCrumbs = [
    {
        title: "Users",
        link: "/admin/users",
        icon: null,
    },
    {
        title: "Notification settings",
        link: null,
        icon: null,
    },
];

NotificationPreferences.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default NotificationPreferences;
