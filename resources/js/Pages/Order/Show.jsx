import React from "react";
import { Box, Paper, useTheme } from "@mui/material";
import ClientLayout from "@/Layouts/AuthenticatedLayout";
import { motion } from "framer-motion";
import { processConsentData } from "@/Pages/Order/Components/orderDisplay";
import { containerVariants } from "@/Pages/Order/Components/orderMotion";
import OrderHeader from "@/Pages/Order/Components/Show/OrderHeader";
import TestsRequested from "@/Pages/Order/Components/Show/TestsRequested";
import PatientDetailsCard from "@/Pages/Order/Components/Show/PatientDetailsCard";
import AllPatientsCard from "@/Pages/Order/Components/Show/AllPatientsCard";
import PatientTestAssignmentCard from "@/Pages/Order/Components/Show/PatientTestAssignmentCard";
import RequestFormCard from "@/Pages/Order/Components/Show/RequestFormCard";
import ClinicalFilesCard from "@/Pages/Order/Components/Show/ClinicalFilesCard";
import ConsentCard from "@/Pages/Order/Components/Show/ConsentCard";

/**
 * Order Show page with A5 print optimization. The page composes focused,
 * print-aware section components (see Components/Show/*) so each card can be
 * reasoned about and tested in isolation.
 */
const Show = ({ order: { consents, ...restOrder }, patients = [] }) => {
    const theme = useTheme();

    const { restConsents, consentForm } = processConsentData(consents);

    return (
        <Box
            component={motion.div}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            sx={{
                width: "100%",
                '@media print': {
                    // A5 paper dimensions and settings
                    '@page': {
                        size: 'A5',
                        margin: '10mm'
                    },
                    margin: 0,
                    padding: 0,
                    fontSize: '9px',
                    lineHeight: 1.2,
                    color: '#000 !important',
                    backgroundColor: '#fff !important'
                }
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 3 },
                    mt: 2,
                    mb: 4,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    overflow: 'hidden',
                    '@media print': {
                        boxShadow: 'none !important',
                        border: 'none !important',
                        borderRadius: '0 !important',
                        margin: '0 !important',
                        padding: '5mm !important',
                        backgroundColor: '#fff !important'
                    }
                }}
            >
                <OrderHeader order={restOrder} />

                <TestsRequested tests={restOrder.tests} />

                <PatientDetailsCard order={restOrder} />

                {patients.length > 1 && (
                    <AllPatientsCard patients={patients} mainPatientId={restOrder.main_patient_id} />
                )}

                {patients.length > 0 && restOrder.order_items && restOrder.order_items.length > 0 && (
                    <PatientTestAssignmentCard
                        orderItems={restOrder.order_items}
                        mainPatientId={restOrder.main_patient_id}
                    />
                )}

                {restOrder?.orderForms?.length > 0 && (
                    <RequestFormCard orderForms={restOrder.orderForms} />
                )}

                {restOrder?.files && restOrder.files.length > 0 && (
                    <ClinicalFilesCard files={restOrder.files} />
                )}

                <ConsentCard restConsents={restConsents} consentForm={consentForm} />
            </Paper>
        </Box>
    );
};

// Define breadcrumbs for layout
const breadcrumbs = [
    {
        title: "Orders",
        link: route("orders.index"),
        icon: null
    },
];

// Set layout for the page
Show.layout = (page) => (
    <ClientLayout
        auth={page.props.auth}
        breadcrumbs={[
            ...breadcrumbs,
            {
                title: "Order #" + page.props.order.id,
                link: "",
                icon: null
            },
        ]}
        children={page}
    />
);

export default Show;
