import React from "react";
import {
    Box,
    Typography,
    Chip,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Button,
    Stack,
    Divider,
    Avatar,
    useTheme,
    alpha,
    IconButton,
    Tooltip,
    Paper,
} from "@mui/material";
import {
    Edit as EditIcon,
    ArrowBack as ArrowBackIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
    Biotech as BiotechIcon,
    People as PeopleIcon,
    RemoveRedEye as ViewIcon,
    Download as DownloadIcon,
    CalendarMonth as CalendarIcon,
    Badge as BadgeIcon,
    Wc as GenderIcon,
    Public as NationalityIcon,
    FamilyRestroom as FamilyIcon,
    ChildCare as ChildIcon,
} from "@mui/icons-material";
import ClientLayout from "@/Layouts/AuthenticatedLayout";
import { router } from "@inertiajs/react";
import { motion } from "framer-motion";

const getGenderLabel = (gender) => ({ '1': 'Male', '0': 'Female', '-1': 'Unknown' }[String(gender)] ?? 'Unknown');
const getGenderColor = (gender) => ({ '1': 'primary', '0': 'secondary', '-1': 'default' }[String(gender)] ?? 'default');

const getStatusColor = (status) => ({
    'requested': 'info',
    'logistic requested': 'warning',
    'sent': 'primary',
    'received': 'success',
    'processing': 'secondary',
    'reported': 'success',
    'report downloaded': 'default',
    'pending': 'error',
}[status] ?? 'default');

const InfoRow = ({ icon: Icon, label, value, color }) => {
    const theme = useTheme();
    if (!value) return null;
    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 0.75 }}>
            <Icon sx={{ fontSize: 18, color: color ?? theme.palette.text.secondary, mt: 0.2, flexShrink: 0 }} />
            <Box>
                <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.2}>
                    {label}
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                    {value}
                </Typography>
            </Box>
        </Box>
    );
};

const Show = ({ patient }) => {
    const theme = useTheme();
    const orders = patient.orders ?? [];
    const relatedPatients = patient.related_patients ?? patient.RelatedPatients ?? [];

    const initials = (patient.fullName ?? '')
        .split(' ')
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase();

    const gotoPage = (url) => (e) => {
        e.preventDefault();
        router.visit(url);
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
    };

    return (
        <Box
            component={motion.div}
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            sx={{ width: '100%' }}
        >
            {/* ── Header ── */}
            <Box
                component={motion.div}
                variants={itemVariants}
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    mb: 3,
                    gap: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        sx={{
                            width: 56,
                            height: 56,
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: theme.palette.primary.main,
                            fontWeight: 700,
                            fontSize: '1.2rem',
                        }}
                    >
                        {initials || <PersonIcon />}
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>{patient.fullName}</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" mt={0.5}>
                            <Chip
                                label={getGenderLabel(patient.gender)}
                                size="small"
                                color={getGenderColor(patient.gender)}
                                variant="outlined"
                                sx={{ fontWeight: 500 }}
                            />
                            {patient.isFetus && (
                                <Chip icon={<ChildIcon />} label="Fetus" size="small" color="info" variant="outlined" />
                            )}
                        </Stack>
                    </Box>
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        startIcon={<ArrowBackIcon />}
                        href={route("patients.index")}
                        onClick={gotoPage(route("patients.index"))}
                        sx={{ borderRadius: 1, textTransform: 'none' }}
                    >
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<EditIcon />}
                        href={route("patients.edit", patient.id)}
                        onClick={gotoPage(route("patients.edit", patient.id))}
                        sx={{ borderRadius: 1, textTransform: 'none', boxShadow: 'none' }}
                    >
                        Edit Patient
                    </Button>
                </Stack>
            </Box>

            <Grid container spacing={3}>
                {/* ── Patient Details Card ── */}
                <Grid item xs={12} md={4} component={motion.div} variants={itemVariants}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: theme.palette.divider,
                            height: '100%',
                        }}
                    >
                        <CardHeader
                            title={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon color="primary" fontSize="small" />
                                    <Typography variant="h6" fontWeight={600}>Patient Info</Typography>
                                </Box>
                            }
                            sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.04),
                                borderBottom: '1px solid',
                                borderColor: theme.palette.divider,
                                py: 1.5,
                            }}
                        />
                        <CardContent sx={{ p: 2.5 }}>
                            <InfoRow
                                icon={CalendarIcon}
                                label="Date of Birth"
                                value={patient.dateOfBirth
                                    ? new Date(patient.dateOfBirth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                                    : null}
                            />
                            <InfoRow
                                icon={NationalityIcon}
                                label="Nationality"
                                value={typeof patient.nationality === 'object'
                                    ? (patient.nationality?.label || patient.nationality?.name)
                                    : patient.nationality}
                            />
                            <InfoRow
                                icon={BadgeIcon}
                                label="ID Number"
                                value={patient.id_no}
                            />
                            <InfoRow
                                icon={BadgeIcon}
                                label="Reference ID"
                                value={patient.reference_id}
                            />
                            {patient.consanguineousParents !== undefined && patient.consanguineousParents !== null && (
                                <>
                                    <Divider sx={{ my: 1.5 }} />
                                    <InfoRow
                                        icon={FamilyIcon}
                                        label="Consanguineous Parents"
                                        value={
                                            patient.consanguineousParents == 1 ? 'Yes'
                                            : patient.consanguineousParents == 0 ? 'No'
                                            : 'Unknown'
                                        }
                                    />
                                </>
                            )}

                            {/* Stats row */}
                            <Divider sx={{ my: 2 }} />
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 1.5,
                                            textAlign: 'center',
                                            bgcolor: alpha(theme.palette.primary.main, 0.06),
                                            borderRadius: 1.5,
                                        }}
                                    >
                                        <Typography variant="h5" fontWeight={700} color="primary.main">
                                            {orders.length}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">Orders</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 1.5,
                                            textAlign: 'center',
                                            bgcolor: alpha(theme.palette.info.main, 0.06),
                                            borderRadius: 1.5,
                                        }}
                                    >
                                        <Typography variant="h5" fontWeight={700} color="info.main">
                                            {patient.order_items?.length ?? patient.order_items_count ?? 0}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">Tests</Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* ── Right column: Orders + Related Patients ── */}
                <Grid item xs={12} md={8}>
                    <Stack spacing={3}>
                        {/* Orders */}
                        <Card
                            component={motion.div}
                            variants={itemVariants}
                            elevation={0}
                            sx={{
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: theme.palette.divider,
                            }}
                        >
                            <CardHeader
                                title={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AssignmentIcon color="primary" fontSize="small" />
                                        <Typography variant="h6" fontWeight={600}>Orders</Typography>
                                        <Chip
                                            label={orders.length}
                                            size="small"
                                            color="primary"
                                            sx={{ ml: 0.5, height: 20, fontSize: '0.75rem' }}
                                        />
                                    </Box>
                                }
                                sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                                    borderBottom: '1px solid',
                                    borderColor: theme.palette.divider,
                                    py: 1.5,
                                }}
                            />
                            <CardContent sx={{ p: 0 }}>
                                {orders.length === 0 ? (
                                    <Box sx={{ py: 5, textAlign: 'center' }}>
                                        <AssignmentIcon sx={{ fontSize: 40, color: alpha(theme.palette.text.secondary, 0.3), mb: 1 }} />
                                        <Typography color="text.secondary">No orders yet</Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ overflowX: 'auto' }}>
                                        <Box
                                            component="table"
                                            sx={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                '& th': {
                                                    textAlign: 'left',
                                                    px: 2,
                                                    py: 1.25,
                                                    typography: 'caption',
                                                    fontWeight: 600,
                                                    color: 'text.secondary',
                                                    bgcolor: alpha(theme.palette.background.default, 0.6),
                                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                                    whiteSpace: 'nowrap',
                                                },
                                                '& td': {
                                                    px: 2,
                                                    py: 1.25,
                                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                                    verticalAlign: 'middle',
                                                },
                                                '& tr:last-child td': { borderBottom: 'none' },
                                                '& tbody tr:hover td': {
                                                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                                                },
                                            }}
                                        >
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Tests</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orders.map((order) => (
                                                    <tr key={order.id}>
                                                        <td>
                                                            <Typography variant="body2" fontWeight={600} color="primary">
                                                                #{order.id}
                                                            </Typography>
                                                        </td>
                                                        <td>
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                {(order.tests ?? []).map((test, i) => (
                                                                    <Chip
                                                                        key={i}
                                                                        label={test.name}
                                                                        size="small"
                                                                        sx={{ fontSize: '0.7rem', height: 20 }}
                                                                    />
                                                                ))}
                                                                {(!order.tests || order.tests.length === 0) && (
                                                                    <Typography variant="body2" color="text.secondary">—</Typography>
                                                                )}
                                                            </Box>
                                                        </td>
                                                        <td>
                                                            <Chip
                                                                label={order.status}
                                                                size="small"
                                                                color={getStatusColor(order.status)}
                                                                sx={{ fontWeight: 500 }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {order.created_at
                                                                    ? new Date(order.created_at).toLocaleDateString(undefined, {
                                                                        year: 'numeric', month: 'short', day: 'numeric'
                                                                    })
                                                                    : '—'}
                                                            </Typography>
                                                        </td>
                                                        <td>
                                                            <Stack direction="row" spacing={0.5}>
                                                                {order.status !== 'pending' && (
                                                                    <Tooltip title="View Order">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="info"
                                                                            href={route("orders.show", order.id)}
                                                                            onClick={gotoPage(route("orders.show", order.id))}
                                                                            sx={{
                                                                                border: '1px solid',
                                                                                borderColor: alpha(theme.palette.info.main, 0.3),
                                                                                '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) },
                                                                            }}
                                                                        >
                                                                            <ViewIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                                {order.editable && (
                                                                    <Tooltip title="Edit Order">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="warning"
                                                                            href={route("orders.edit", { order: order.id, step: order.step })}
                                                                            onClick={gotoPage(route("orders.edit", { order: order.id, step: order.step }))}
                                                                            sx={{
                                                                                border: '1px solid',
                                                                                borderColor: alpha(theme.palette.warning.main, 0.3),
                                                                                '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.1) },
                                                                            }}
                                                                        >
                                                                            <EditIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                                {['reported', 'report downloaded'].includes(order.status) && (
                                                                    <Tooltip title="Download Report">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="success"
                                                                            href={route("orders.report", order.id)}
                                                                            target="_blank"
                                                                            sx={{
                                                                                border: '1px solid',
                                                                                borderColor: alpha(theme.palette.success.main, 0.3),
                                                                                '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) },
                                                                            }}
                                                                        >
                                                                            <DownloadIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                            </Stack>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>

                        {/* Related Patients */}
                        {relatedPatients.length > 0 && (
                            <Card
                                component={motion.div}
                                variants={itemVariants}
                                elevation={0}
                                sx={{
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: theme.palette.divider,
                                }}
                            >
                                <CardHeader
                                    title={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <PeopleIcon color="primary" fontSize="small" />
                                            <Typography variant="h6" fontWeight={600}>Related Patients</Typography>
                                            <Chip
                                                label={relatedPatients.length}
                                                size="small"
                                                color="primary"
                                                sx={{ ml: 0.5, height: 20, fontSize: '0.75rem' }}
                                            />
                                        </Box>
                                    }
                                    sx={{
                                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                                        borderBottom: '1px solid',
                                        borderColor: theme.palette.divider,
                                        py: 1.5,
                                    }}
                                />
                                <CardContent sx={{ p: 2 }}>
                                    <Stack spacing={1}>
                                        {relatedPatients.map((related) => (
                                            <Box
                                                key={related.id}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: 1.5,
                                                    borderRadius: 1.5,
                                                    border: '1px solid',
                                                    borderColor: theme.palette.divider,
                                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            bgcolor: alpha(theme.palette.secondary.main, 0.12),
                                                            color: theme.palette.secondary.main,
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {(related.fullName ?? '?').charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>{related.fullName}</Typography>
                                                        {related.pivot?.relation_type && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {related.pivot.relation_type}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                                <Tooltip title="View Patient">
                                                    <IconButton
                                                        size="small"
                                                        color="info"
                                                        href={route("patients.show", related.id)}
                                                        onClick={gotoPage(route("patients.show", related.id))}
                                                    >
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        ))}
                                    </Stack>
                                </CardContent>
                            </Card>
                        )}
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

const breadcrumbs = [
    { title: "Patients", link: route("patients.index"), icon: null },
    { title: "Patient Details", link: "", icon: null },
];

Show.layout = (page) => (
    <ClientLayout auth={page.props.auth} breadcrumbs={breadcrumbs} children={page} />
);

export default Show;
