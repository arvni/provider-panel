import React from "react";
import {
    Paper,
    Step,
    StepButton,
    StepLabel,
    Stepper,
    Box,
    Typography,
    Divider,
    Button,
    IconButton,
    Tooltip,
    useTheme,
    alpha,
    useMediaQuery,
    StepConnector,
    styled, StepIcon
} from "@mui/material";
import { router } from "@inertiajs/react";
import ClientLayout from "@/Layouts/AuthenticatedLayout";
import {
    Science as ScienceIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
    Biotech as BiotechIcon,
    FactCheck as FactCheckIcon,
    DoneAll as DoneAllIcon,
    ArrowBack as ArrowBackIcon,
    SaveAlt as SaveIcon,
    Cancel as CancelIcon,
    HelpOutline as HelpIcon
} from "@mui/icons-material";
import { motion } from "framer-motion";

// Step icons mapping
const stepIcons = {
    "test method": ScienceIcon,
    "patient details": PersonIcon,
    "clinical details": AssignmentIcon,
    "sample details": BiotechIcon,
    "consent form": FactCheckIcon,
    "finalize": DoneAllIcon
};

// Step descriptions
const stepDescriptions = {
    "test method": "Select the tests to be performed",
    "patient details": "Enter patient information and demographics",
    "clinical details": "Provide relevant clinical information",
    "sample details": "Add details about the sample(s) collected",
    "consent form": "Complete the required consent forms",
    "finalize": "Review and submit the order"
};

// Custom styled connector for the stepper
const CustomConnector = styled(StepConnector)(({ theme }) => ({
    '& .MuiStepConnector-line': {
        borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300],
        borderTopWidth: 3,
        borderRadius: 1,
    },
    '&.Mui-active': {
        '& .MuiStepConnector-line': {
            borderColor: theme.palette.primary.main,
        },
    },
    '&.Mui-completed': {
        '& .MuiStepConnector-line': {
            borderColor: theme.palette.primary.main,
        },
    },
}));


// Define steps for the order editing process
const steps = ["test method", "patient details", "clinical details", "sample details", "consent form", "finalize"];

/**
 * Enhanced EditLayout component with improved stepper and navigation
 */
const EditLayout = ({ auth, step, children, id, onSubmit }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Find the current active step
    let activeStep = steps.findIndex((item) => item === step);
    if (activeStep === -1) activeStep = 0;

    // Handle step navigation
    const handleStep = (s) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route("orders.edit", { step: s, order: id }));
    };

    // Handle previous step navigation
    const handlePrevStep = () => {
        if (activeStep > 0) {
            const prevStep = steps[activeStep - 1];
            router.visit(route("orders.edit", { step: prevStep, order: id }));
        }
    };

    // Handle next step navigation
    const handleNextStep = () => {
        if (activeStep < steps.length - 1 && !onSubmit) {
            const nextStep = steps[activeStep + 1];
            router.visit(route("orders.edit", { step: nextStep, order: id }));
        }else
            onSubmit();
    };

    // Handle cancel action
    const handleCancel = () => {
        router.visit(route("orders.index"));
    };

    return (
        <ClientLayout
            auth={auth}
            breadcrumbs={[
                ...breadcrumbs,
                {
                    title: `Order #${id}`,
                    link: route("orders.show", id),
                    icon: null
                },
                {
                    title: `Edit: ${step.charAt(0).toUpperCase() + step.slice(1)}`,
                    link: "",
                    icon: null
                },
            ]}
        >
            <Box
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                sx={{ width: '100%' }}
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
                        overflow: 'hidden'
                    }}
                >
                    {/* Header with title and order info */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            mb: 3,
                        }}
                    >
                        <Box>
                            <Typography
                                variant="h5"
                                fontWeight={700}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main
                                    }}
                                >
                                    {React.createElement(stepIcons[step] || AssignmentIcon)}
                                </Box>
                                Edit Order #{id}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                            >
                                {stepDescriptions[step] || `Step ${activeStep + 1} of ${steps.length}`}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, mt: { xs: 2, sm: 0 } }}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                size="small"
                                startIcon={<CancelIcon />}
                                onClick={handleCancel}
                                sx={{
                                    borderRadius: 1,
                                    textTransform: 'none'
                                }}
                            >
                                Cancel
                            </Button>

                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                startIcon={<SaveIcon />}
                                form="current-step-form" // Connect to the form's id
                                type="submit"
                                sx={{
                                    borderRadius: 1,
                                    textTransform: 'none',
                                    boxShadow: 'none',
                                    '&:hover': {
                                        boxShadow: theme.shadows[2]
                                    }
                                }}
                            >
                                Save
                            </Button>
                        </Box>
                    </Box>

                    {/* Custom Stepper */}
                    <Box sx={{ mb: 4, py: 1 }}>
                        <Stepper
                            activeStep={activeStep}
                            alternativeLabel={!isMobile}
                            orientation={isMobile ? "vertical" : "horizontal"}
                            connector={<CustomConnector />}
                        >
                            {steps.map((item, index) => {
                                const StepIcon = stepIcons[item] || AssignmentIcon;
                                const isCompleted = index < activeStep;
                                const isActive = index === activeStep;

                                return (
                                    <Step
                                        key={index}
                                        completed={isCompleted}
                                        sx={{
                                            '& .MuiStepLabel-iconContainer': {
                                                p: 0
                                            }
                                        }}
                                    >
                                        <StepButton
                                            color="inherit"
                                            onClick={handleStep(item)}
                                            href={route("orders.edit", { step: item, order: id })}
                                            sx={{
                                                borderRadius: 1,
                                                '&:hover': {
                                                    bgcolor: alpha(theme.palette.primary.main, 0.04)
                                                }
                                            }}
                                        >
                                            <StepLabel
                                                StepIconComponent={() => (
                                                    <Box
                                                        sx={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            bgcolor: isCompleted
                                                                ? theme.palette.primary.main
                                                                : isActive
                                                                    ? alpha(theme.palette.primary.main, 0.1)
                                                                    : theme.palette.grey[300],
                                                            color: isCompleted
                                                                ? theme.palette.primary.contrastText
                                                                : isActive
                                                                    ? theme.palette.primary.main
                                                                    : theme.palette.text.secondary,
                                                            transition: 'all 0.3s ease',
                                                            border: isActive ? `2px solid ${theme.palette.primary.main}` : 'none'
                                                        }}
                                                    >
                                                        {isCompleted ? (
                                                            <DoneAllIcon fontSize="small" />
                                                        ) : (
                                                            <StepIcon fontSize="small" />
                                                        )}
                                                    </Box>
                                                )}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={isActive || isCompleted ? 600 : 400}
                                                    color={isActive ? 'primary.main' : isCompleted ? 'text.primary' : 'text.secondary'}
                                                    sx={{ textTransform: 'capitalize' }}
                                                >
                                                    {item}
                                                </Typography>
                                            </StepLabel>
                                        </StepButton>
                                    </Step>
                                );
                            })}
                        </Stepper>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {/* Content Area */}
                    <Box sx={{ mb: 4 }}>
                        {children}
                    </Box>

                    {/* Navigation Buttons */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            pt: 3,
                            mt: 3,
                            borderTop: '1px solid',
                            borderColor: theme.palette.divider
                        }}
                    >
                        <Button
                            variant="outlined"
                            color="inherit"
                            startIcon={<ArrowBackIcon />}
                            onClick={handlePrevStep}
                            disabled={activeStep === 0}
                            sx={{
                                borderRadius: 1,
                                textTransform: 'none'
                            }}
                        >
                            Previous Step
                        </Button>

                        <Button
                            variant="contained"
                            color="primary"
                            endIcon={activeStep < steps.length - 1 && !isMobile ? <StepIcon fontSize="small" /> : null}
                            onClick={handleNextStep}
                            disabled={activeStep === steps.length - 1}
                            sx={{
                                borderRadius: 1,
                                textTransform: 'none',
                                boxShadow: 'none',
                                '&:hover': {
                                    boxShadow: theme.shadows[2]
                                }
                            }}
                        >
                            {activeStep < steps.length - 1 ? `Next: ${steps[activeStep + 1].charAt(0).toUpperCase() + steps[activeStep + 1].slice(1)}` : 'Complete'}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </ClientLayout>
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

export default EditLayout;
