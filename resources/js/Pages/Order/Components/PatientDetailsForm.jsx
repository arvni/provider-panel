import React, {useState} from "react";
import {
    Autocomplete,
    Box,
    Button,
    FormControl,
    FormHelperText,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
    Tooltip,
    IconButton,
    Card,
    CardContent,
    useTheme,
    alpha,
    Alert,
} from "@mui/material";
import {
    Person as PersonIcon,
    ContactPhone as ContactPhoneIcon,
    PersonSearch as PersonSearchIcon,
    Help as HelpIcon,
    Flag as FlagIcon,
    Cake as CakeIcon,
    Badge as BadgeIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    MedicalInformation as MedicalIcon,
    Info as InfoIcon
} from "@mui/icons-material";
import countries from "@/Data/countries";
import CountrySelector from "@/Components/CountrySelector";
import Gender from "@/Enums/Gender.js";
import {motion, AnimatePresence} from "framer-motion";

/**
 * Enhanced PatientDetailsForm with improved layout and UX
 */
const PatientDetailsForm = (props) => {
    const theme = useTheme();
    const [showHelp, setShowHelp] = useState(false);

    // Handle patient field changes
    const handleChange = (e) => {
        props.onChange(e.target.name, e.target.value);
    };

    // Handle contact field changes
    const handleContactChange = (e) => {
        let contact = {...props.patient?.contact, [e.target.name]: e.target.value};
        props.onChange("contact", contact);
    };

    // Handle nationality change
    const handleNationalityChange = (e, value) => {
        props.onChange("nationality", value);
    };

    // Handle contact country change
    const handleContactCountryChange = (e, value) => {
        let contact = {
            ...props.patient?.contact,
            country: value,
            phone: props.patient?.contact?.phone ?? ("+" + value?.phone)
        };
        props.onChange("contact", contact);
    };

    // Handle phone country code change
    const handlePhoneCountryCodeChange = (phone) => {
        const contact = {
            ...props.patient?.contact,
            phone: "+" + phone
        };
        props.onChange("contact", contact);
    };

    // Toggle help information
    const toggleHelp = () => {
        setShowHelp(!showHelp);
    };


    // Animations
    const containerVariants = {
        hidden: {opacity: 0},
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.1,
            }
        }
    };

    const itemVariants = {
        hidden: {y: 20, opacity: 0},
        visible: {
            y: 0,
            opacity: 1,
            transition: {duration: 0.4}
        }
    };

    return (
        <Box
            component={motion.div}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            sx={{width: '100%'}}
        >
            {/* Help section */}
            <AnimatePresence>
                {showHelp && (
                    <motion.div
                        initial={{opacity: 0, height: 0}}
                        animate={{opacity: 1, height: 'auto'}}
                        exit={{opacity: 0, height: 0}}
                        transition={{duration: 0.3}}
                    >
                        <Alert
                            severity="info"
                            icon={<InfoIcon/>}
                            sx={{
                                mb: 3,
                                borderRadius: 2,
                                '& .MuiAlert-icon': {
                                    alignItems: 'center'
                                }
                            }}
                            onClose={toggleHelp}
                        >
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Patient Information Guidelines
                            </Typography>
                            <Typography variant="body2" paragraph>
                                Please fill in all required fields marked with an asterisk (*). Accurate patient
                                information ensures proper test processing and reporting.
                            </Typography>
                            <Box component="ul" sx={{m: 0, pl: 2}}>
                                <Box component="li" sx={{mb: 0.5}}>
                                    <Typography variant="body2">
                                        <strong>Patient Name:</strong> Enter the full legal name as it appears on
                                        official documents
                                    </Typography>
                                </Box>
                                <Box component="li" sx={{mb: 0.5}}>
                                    <Typography variant="body2">
                                        <strong>Date of Birth:</strong> Use the calendar picker for accurate date entry
                                    </Typography>
                                </Box>
                                <Box component="li">
                                    <Typography variant="body2">
                                        <strong>Consanguineous Parents:</strong> Important for genetic test
                                        interpretation
                                    </Typography>
                                </Box>
                            </Box>
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            <Grid
                container
                spacing={3}
                component={motion.div}
                variants={itemVariants}
            >
                {/* Left column - Patient information */}
                <Grid item xs={12} md={8}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: theme.palette.divider,
                            overflow: 'hidden',
                            height: '100%'
                        }}
                    >
                        {/* Patient information section */}
                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                borderBottom: '1px solid',
                                borderColor: theme.palette.divider,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                <PersonIcon color="primary"/>
                                <Typography variant="h6" fontWeight={600}>
                                    Patient Information
                                </Typography>
                            </Box>

                            <Tooltip title="Show help">
                                <IconButton
                                    size="small"
                                    onClick={toggleHelp}
                                    color={showHelp ? "primary" : "default"}
                                >
                                    <HelpIcon/>
                                </IconButton>
                            </Tooltip>
                        </Box>

                        <CardContent sx={{p: 3}}>
                            {/* Required Patient Fields */}
                            <Grid container spacing={2} mb={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="ID Number"
                                        value={props.patient?.id_no ?? ""}
                                        name="id_no"
                                        error={!!props.errors["id_no"]}
                                        helperText={props.errors["id_no"]}
                                        onChange={handleChange}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <BadgeIcon color="action" fontSize="small"/>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Reference ID"
                                        value={props.patient?.reference_id ?? ""}
                                        name="reference_id"
                                        error={!!props.errors["reference_id"]}
                                        helperText={props.errors["reference_id"]}
                                        onChange={handleChange}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <BadgeIcon color="action" fontSize="small"/>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        required
                                        error={!!props.errors["fullName"]}
                                        helperText={props.errors["fullName"]}
                                        label="Patient Full Name"
                                        value={props.patient?.fullName ?? ""}
                                        name="fullName"
                                        onChange={handleChange}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonIcon color="action" fontSize="small"/>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth required>
                                        <InputLabel
                                            error={!!props.errors["gender"]}
                                            id="gender-label"
                                        >
                                            Gender
                                        </InputLabel>
                                        <Select
                                            required
                                            labelId="gender-label"
                                            id="gender-select"
                                            value={props.patient?.gender ?? ""}
                                            error={!!props.errors["gender"]}
                                            label="Gender"
                                            name="gender"
                                            onChange={handleChange}
                                        >
                                            {props.genders.map((gender, index) => (
                                                <MenuItem key={index} value={gender}>
                                                    {Gender.get(gender)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        <FormHelperText error={!!props.errors["gender"]}>
                                            {props.errors["gender"]}
                                        </FormHelperText>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Date Of Birth"
                                        error={!!props.errors["dateOfBirth"]}
                                        helperText={props.errors["dateOfBirth"]}
                                        value={props.patient?.dateOfBirth ?? ""}
                                        name="dateOfBirth"
                                        type="date"
                                        onChange={handleChange}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CakeIcon color="action" fontSize="small"/>
                                                </InputAdornment>
                                            ),
                                            sx: {textAlign: "right"}
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth required>
                                        <InputLabel
                                            id="consanguineousParents-label"
                                            error={!!props.errors["consanguineousParents"]}
                                        >
                                            Are Parents Consanguineous?
                                        </InputLabel>
                                        <Select
                                            required
                                            labelId="consanguineousParents-label"
                                            id="consanguineousParents-select"
                                            value={props.patient?.consanguineousParents ?? ""}
                                            name="consanguineousParents"
                                            label="Are Parents Consanguineous?"
                                            error={!!props.errors["consanguineousParents"]}
                                            onChange={handleChange}
                                            startAdornment={
                                                <InputAdornment position="start">
                                                    <MedicalIcon color="action" fontSize="small"/>
                                                </InputAdornment>
                                            }
                                        >
                                            <MenuItem value="1">Yes</MenuItem>
                                            <MenuItem value="0">No</MenuItem>
                                            <MenuItem value="-1">Unknown</MenuItem>
                                        </Select>
                                        {props.errors["consanguineousParents"] && (
                                            <FormHelperText error>
                                                {props.errors["consanguineousParents"]}
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Autocomplete
                                        id="nationality-select"
                                        options={countries}
                                        value={props.patient?.nationality ?? null}
                                        onChange={handleNationalityChange}
                                        autoHighlight
                                        getOptionLabel={(option) => option.label}
                                        renderOption={(props, option) => (
                                            <Box
                                                component="li"
                                                sx={{'& > img': {mr: 2, flexShrink: 0}}}
                                                {...props}
                                            >
                                                <img
                                                    loading="lazy"
                                                    width="20"
                                                    src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                                                    srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                                                    alt=""
                                                />
                                                {option.label} ({option.code})
                                            </Box>
                                        )}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                required
                                                error={!!props.errors["nationality.code"]}
                                                helperText={props.errors["nationality.code"]}
                                                InputProps={{
                                                    ...params.InputProps,
                                                    autoComplete: 'new-password',
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <FlagIcon color="action" fontSize="small"/>
                                                            {params.InputProps.startAdornment}
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                label="Nationality"
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>

                            {/* Contact Information Section */}
                            <Box sx={{mt: 4, mb: 2}}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mb: 2
                                    }}
                                >
                                    <ContactPhoneIcon color="primary"/>
                                    <Typography variant="h6" fontWeight={600}>
                                        Contact Information
                                    </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Autocomplete
                                            id="country-select"
                                            options={countries}
                                            value={props.patient?.contact?.country}
                                            onChange={handleContactCountryChange}
                                            autoHighlight
                                            getOptionLabel={(option) => option.label}
                                            renderOption={(props, option) => (
                                                <Box
                                                    component="li"
                                                    sx={{'& > img': {mr: 2, flexShrink: 0}}}
                                                    {...props}
                                                >
                                                    <img
                                                        loading="lazy"
                                                        width="20"
                                                        src={`https://flagcdn.com/w20/${option?.code?.toLowerCase()}.png`}
                                                        srcSet={`https://flagcdn.com/w40/${option?.code?.toLowerCase()}.png 2x`}
                                                        alt=""
                                                    />
                                                    {option.label} ({option.code})
                                                </Box>
                                            )}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Country"
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        autoComplete: 'new-password',
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <FlagIcon color="action" fontSize="small"/>
                                                                {params.InputProps.startAdornment}
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Phone"
                                            error={!!props.errors['contact.phone']}
                                            helperText={props.errors['contact.phone']}
                                            value={props.patient?.contact?.phone ?? ""}
                                            name="phone"
                                            onChange={handleContactChange}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <PhoneIcon color="action" fontSize="small"/>
                                                        <CountrySelector
                                                            value={props.patient?.contact?.phone?.substring(1) ?? ""}
                                                            onChange={handlePhoneCountryCodeChange}
                                                        />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            value={props.patient?.contact?.email ?? ""}
                                            name="email"
                                            error={!!props.errors['contact.email']}
                                            helperText={props.errors['contact.email']}
                                            onChange={handleContactChange}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <EmailIcon color="action" fontSize="small"/>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="City"
                                            value={props.patient?.contact?.city ?? ""}
                                            name="city"
                                            onChange={handleContactChange}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <LocationIcon color="action" fontSize="small"/>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="State/Province"
                                            value={props.patient?.contact?.state ?? ""}
                                            name="state"
                                            onChange={handleContactChange}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <LocationIcon color="action" fontSize="small"/>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Address"
                                            value={props.patient?.contact?.address ?? ""}
                                            name="address"
                                            onChange={handleContactChange}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <LocationIcon color="action" fontSize="small"/>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right column - Patient selection and action buttons */}
                <Grid item xs={12} md={4}>
                    <Stack spacing={3} height="100%">
                        {/* Patient selection card */}
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: theme.palette.divider,
                                bgcolor: alpha(theme.palette.background.default, 0.5)
                            }}
                        >
                            <CardContent sx={{p: 3}}>
                                <Typography
                                    variant="subtitle1"
                                    fontWeight={600}
                                    sx={{
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}
                                >
                                    <PersonSearchIcon color="primary"/>
                                    Select Existing Patient
                                </Typography>

                                <Typography variant="body2" color="text.secondary" paragraph>
                                    To use an existing patient's information, click the button below to select from your
                                    patient list.
                                </Typography>

                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<PersonSearchIcon/>}
                                    onClick={props.handlePatientListOpen}
                                    sx={{
                                        mt: 1,
                                        borderRadius: 1.5,
                                        textTransform: 'none',
                                        py: 1,
                                        boxShadow: 'none',
                                        '&:hover': {
                                            boxShadow: theme.shadows[2]
                                        }
                                    }}
                                >
                                    Choose From Patient List
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Required fields reminder */}
                        <Alert
                            severity="info"
                            variant="outlined"
                            icon={<InfoIcon/>}
                            sx={{
                                borderRadius: 2,
                                '& .MuiAlert-icon': {
                                    alignItems: 'flex-start',
                                    pt: 1
                                }
                            }}
                        >
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Required Information
                            </Typography>
                            <Box component="ul" sx={{m: 0, pl: 2, mb: 0}}>
                                <Box component="li" sx={{mb: 0.5}}>
                                    <Typography variant="body2">Full name</Typography>
                                </Box>
                                <Box component="li" sx={{mb: 0.5}}>
                                    <Typography variant="body2">Date of birth</Typography>
                                </Box>
                                <Box component="li" sx={{mb: 0.5}}>
                                    <Typography variant="body2">Gender</Typography>
                                </Box>
                                <Box component="li">
                                    <Typography variant="body2">Nationality</Typography>
                                </Box>
                            </Box>
                        </Alert>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PatientDetailsForm;
