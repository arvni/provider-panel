import React, { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    Tooltip,
    Typography,
    Avatar
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Science,
    CheckCircleOutline,
    Warning,
    ScienceOutlined,
    DragIndicator
} from "@mui/icons-material";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import DeleteButton from "@/Components/DeleteButton";
import AddSampleTypeForm from "./AddSampleTypeForm";
import { makeId } from "@/Services/makeUUID";

/**
 * SampleTypeForm component
 * Allows adding and managing sample types for tests
 *
 * @param {Object} props Component props
 * @param {Object} props.error Validation error
 * @param {Array} props.sampleTypes Sample types list
 * @param {Function} props.onChange Update handler
 * @param {boolean} props.disabled Whether the component is disabled
 * @returns {JSX.Element} Rendered component
 */
const SampleTypeForm = ({ error, sampleTypes = [], onChange, disabled = false }) => {
    // Initialize sample type state
    const [sampleType, setSampleType] = useState({
        description: "",
        id: makeId(),
        sample_type: undefined,
        is_default: false
    });

    // Dialog open state
    const [openAddSampleType, setOpenAddSampleType] = useState(false);

    /**
     * Add or update sample type
     */
    const handleAddSampleType = () => {
        let newSampleTypes = [...sampleTypes];
        let index = newSampleTypes.findIndex((item) => item.id === sampleType.id);

        if (index === -1) {
            // Add new sample type
            newSampleTypes.push(sampleType);
        } else {
            // Update existing sample type
            newSampleTypes.splice(index, 1, sampleType);
        }

        // If this is a default sample type, update other sample types to not be default
        if (sampleType.is_default) {
            newSampleTypes = newSampleTypes.map(item => {
                if (item.id !== sampleType.id) {
                    return { ...item, is_default: false };
                }
                return item;
            });
        }

        onChange("sample_types", newSampleTypes);
        handleCloseSampleType();
    };

    /**
     * Close sample type dialog
     */
    const handleCloseSampleType = () => {
        setOpenAddSampleType(false);
        resetSampleType();
    };

    /**
     * Update sample type field
     *
     * @param {string} key Field key
     * @param {any} value Field value
     */
    const handleSampleTypeChange = (key, value) => {
        setSampleType((prevState) => ({
            ...prevState,
            [key]: value
        }));
    };

    /**
     * Reset sample type form
     */
    const resetSampleType = () => {
        setSampleType({
            description: "",
            id: makeId(),
            sample_type: undefined,
            is_default: false
        });
    };

    /**
     * Open add sample type dialog
     */
    const handleAddNewSampleType = () => {
        setOpenAddSampleType(true);
    };

    /**
     * Edit existing sample type
     *
     * @param {number} index Sample type index
     * @returns {Function} Click handler
     */
    const handleEditSampleType = (index) => () => {
        if (sampleTypes && sampleTypes[index]) {
            setSampleType({...sampleTypes[index]});
        }
        setOpenAddSampleType(true);
    };

    /**
     * Delete sample type
     *
     * @param {number} index Sample type index
     * @returns {Function} Click handler
     */
    const handleDeleteSampleType = (index) => () => {
        let newSampleTypes = [...sampleTypes];

        // Check if we're deleting the default sample type
        const isDefault = newSampleTypes[index].is_default;

        // Remove the sample type
        newSampleTypes.splice(index, 1);

        // If we deleted the default sample type, set the first remaining one as default
        if (isDefault && newSampleTypes.length > 0) {
            newSampleTypes[0].is_default = true;
        }

        onChange("sample_types", newSampleTypes);
    };

    /**
     * Handle drag and drop reordering
     *
     * @param {Object} result Drag result
     */
    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const reorderedItems = Array.from(sampleTypes);
        const [removed] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, removed);

        onChange("sample_types", reorderedItems);
    };

    return (
        <>
            {/* Add button and error message */}
            <Box sx={{ mb: 3 }}>
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 2 }}
                >
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddNewSampleType}
                        color="success"
                        disabled={disabled}
                    >
                        Add Sample Type
                    </Button>

                    <Chip
                        label={`${sampleTypes.length} ${sampleTypes.length === 1 ? 'type' : 'types'}`}
                        color="success"
                        variant="outlined"
                        size="small"
                    />
                </Stack>

                {error && (
                    <Alert
                        severity="error"
                        icon={<Warning />}
                        sx={{ mb: 2 }}
                    >
                        {error}
                    </Alert>
                )}
            </Box>

            {sampleTypes.length === 0 ? (
                <Paper
                    variant="outlined"
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        borderStyle: 'dashed',
                        borderWidth: 1,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        mb: 3
                    }}
                >
                    <ScienceOutlined color="disabled" sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />

                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Sample Types Added Yet
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 450, mx: 'auto' }}>
                        Add sample types that are acceptable for this test. You should specify which sample type is the default option.
                    </Typography>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddNewSampleType}
                        color="success"
                        disabled={disabled}
                    >
                        Add First Sample Type
                    </Button>
                </Paper>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="sample-types-list">
                        {(provided) => (
                            <Paper
                                variant="outlined"
                                sx={{
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    mb: 3
                                }}
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                <List disablePadding>
                                    {sampleTypes.map((sample, index) => (
                                        <Draggable
                                            key={sample.id.toString()}
                                            draggableId={sample.id.toString()}
                                            index={index}
                                            isDragDisabled={disabled}
                                        >
                                            {(provided, snapshot) => (
                                                <ListItem
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    divider={index < sampleTypes.length - 1}
                                                    sx={{
                                                        bgcolor: snapshot.isDragging ? 'rgba(76, 175, 80, 0.08)' : 'background.paper',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(76, 175, 80, 0.04)',
                                                        },
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                >
                                                    {/* Drag handle */}
                                                    <ListItemIcon
                                                        {...provided.dragHandleProps}
                                                        sx={{
                                                            cursor: disabled ? 'default' : 'grab',
                                                            color: 'text.secondary',
                                                            '&:hover': {
                                                                color: disabled ? 'text.secondary' : 'success.main'
                                                            }
                                                        }}
                                                    >
                                                        <DragIndicator />
                                                    </ListItemIcon>

                                                    {/* Sample type number and icon */}
                                                    <ListItemAvatar>
                                                        <Avatar
                                                            sx={{
                                                                bgcolor: sample.is_default ? 'success.main' : 'grey.200',
                                                                color: sample.is_default ? 'success.contrastText' : 'text.primary'
                                                            }}
                                                        >
                                                            <Science />
                                                        </Avatar>
                                                    </ListItemAvatar>

                                                    {/* Sample type information */}
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Typography variant="subtitle2">
                                                                    {sample.sample_type?.name || "Unknown Sample Type"}
                                                                </Typography>
                                                                {sample.is_default && (
                                                                    <Chip
                                                                        label="Default"
                                                                        size="small"
                                                                        color="success"
                                                                        icon={<CheckCircleOutline fontSize="small" />}
                                                                    />
                                                                )}
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{ mt: 0.5 }}
                                                            >
                                                                {sample.description || "No description provided"}
                                                            </Typography>
                                                        }
                                                    />

                                                    {/* Action buttons */}
                                                    <Stack direction="row" spacing={1}>
                                                        <Tooltip title="Edit Sample Type">
                                                            <IconButton
                                                                color="primary"
                                                                onClick={handleEditSampleType(index)}
                                                                size="small"
                                                                disabled={disabled}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <DeleteButton
                                                            onConfirm={handleDeleteSampleType(index)}
                                                            size="small"
                                                            disabled={disabled}
                                                            IconProps={{ fontSize: 'small' }}
                                                        />
                                                    </Stack>
                                                </ListItem>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </List>
                            </Paper>
                        )}
                    </Droppable>
                </DragDropContext>
            )}

            {/* Add sample type dialog */}
            <AddSampleTypeForm
                data={sampleType}
                setData={handleSampleTypeChange}
                open={openAddSampleType}
                onClose={handleCloseSampleType}
                onSubmit={handleAddSampleType}
                disabled={disabled}
            />
        </>
    );
};

export default SampleTypeForm;
