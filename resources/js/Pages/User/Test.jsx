import React from "react";
import {
    Autocomplete,
    Box,
    Button,
    Chip,
    Container,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { Cancel, Save } from "@mui/icons-material";
import { router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const Test = ({ user, tests }) => {
    const { data, setData, put, processing, errors } = useForm({
        tests: user.tests ?? user.Tests ?? [],
    });

    const handleSubmit = () => {
        put(route("admin.users.tests.update", user.id));
    };

    const handleCancel = () => {
        router.visit(route("admin.users.index"));
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title={`${user.name} Tests`}
                actions={[
                    <Button
                        key="cancel"
                        onClick={handleCancel}
                        startIcon={<Cancel />}
                        disabled={processing}
                    >
                        Cancel
                    </Button>,
                    <Button
                        key="save"
                        variant="contained"
                        onClick={handleSubmit}
                        startIcon={<Save />}
                        disabled={processing}
                    >
                        Save
                    </Button>,
                ]}
            />

            <Paper sx={{ mt: "3em", p: "1rem" }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h6">Assigned Tests</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Choose the tests this user can order.
                        </Typography>
                    </Box>

                    <Autocomplete
                        multiple
                        options={tests ?? []}
                        value={data.tests ?? []}
                        onChange={(_, value) => setData("tests", value)}
                        disableCloseOnSelect
                        getOptionLabel={(option) => option.name ?? ""}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        renderOption={(props, option) => (
                            <Box component="li" {...props} key={option.id}>
                                <Stack spacing={0.5}>
                                    <Typography variant="body2">{option.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {[option.code, option.shortName]
                                            .filter(Boolean)
                                            .join(" - ")}
                                    </Typography>
                                </Stack>
                            </Box>
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const { key, ...tagProps } = getTagProps({ index });

                                return (
                                    <Chip
                                        key={key}
                                        label={option.name}
                                        color="primary"
                                        {...tagProps}
                                    />
                                );
                            })
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Tests"
                                error={Boolean(errors.tests)}
                                helperText={errors.tests}
                            />
                        )}
                    />
                </Stack>
            </Paper>
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
        title: "User Tests",
        link: null,
        icon: null,
    },
];

Test.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Test;
