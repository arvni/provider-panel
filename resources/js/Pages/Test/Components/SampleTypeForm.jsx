import {
    Alert, Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Stack
} from "@mui/material";
import {Add as AddIcon, Edit} from "@mui/icons-material";
import DeleteButton from "@/Components/DeleteButton";
import React, {useState} from "react";
import AddSampleTypeForm from "./AddSampleTypeForm";
import {makeId} from "@/Services/makeUUID";

const SampleTypeForm = ({error, sampleTypes, onChange}) => {

    const [sampleType, setSampleType] = useState({description: "", id: makeId(), sample_type: undefined, is_default:false});
    const handleAddSampleType = () => {
        let newSampleTypes = [...sampleTypes ?? []];
        let index = newSampleTypes.findIndex((item) => item.id == sampleType.id);
        if (index == -1)
            newSampleTypes.push(sampleType);
        else
            newSampleTypes.splice(index, 1, sampleType);
        onChange("sample_types", newSampleTypes);
        handleCloseSampleType();
    }
    const handleCloseSampleType = () => {
        setOpenAddSampleType(false);
        resetSampleType();
    };
    const handleSampleTypeChange = (key, value) => {
        setSampleType((prevState) => ({...prevState, [key]: value}));
    }
    const resetSampleType = () => {
        setSampleType({description: "", id: makeId(), sample_type: undefined, is_default: false});
    }
    const [openAddSampleType, setOpenAddSampleType] = useState(false);

    const handleAddNewSampleType = () => {
        setOpenAddSampleType(true);
    }

    const handleEditSampleType = (index) => () => {
        sampleTypes ? setSampleType({...sampleTypes[index]}) : null;
        handleAddNewSampleType();
    }
    const handleDeleteSampleType = (index) => () => {
        let newSampleTypes = [...sampleTypes ?? []];
        newSampleTypes.splice(index, 1);
        onChange("sample_types", newSampleTypes);
    }


    return <>
        <Grid item sx={{width: "100%"}}>
            <List>
                <ListItem
                    secondaryAction={
                        <IconButton edge="end"
                                    aria-label="add sample type"
                                    onClick={handleAddNewSampleType}
                                    color="success">
                            <AddIcon fontSize="large"/>
                        </IconButton>
                    }>
                    <ListItemText primary={<h3>Sample Types</h3>}
                                  secondary={error &&
                                      <Alert severity="error">{error}</Alert>}/>
                </ListItem>
                {sampleTypes?.map((sampleType, index) => (
                    <ListItem key={sampleType.id}
                              secondaryAction={<Stack direction="row" spacing={1}>
                                  <IconButton color="warning"
                                              onClick={handleEditSampleType(index)}>
                                      <Edit/>
                                  </IconButton>
                                  <DeleteButton onConfirm={handleDeleteSampleType(index)}/>
                              </Stack>}
                              disablePadding >
                        <ListItemAvatar><h3>{index + 1}</h3></ListItemAvatar>
                        <ListItemText primary={sampleType.sample_type.name} secondary={sampleType.description}/>
                        <Divider/>
                    </ListItem>
                ))}
            </List>
        </Grid>

        {openAddSampleType ?
            <AddSampleTypeForm data={sampleType}
                               setData={handleSampleTypeChange}
                               open={openAddSampleType}
                               onClose={handleCloseSampleType}
                               onSubmit={handleAddSampleType}/> : null}
    </>
}
export default SampleTypeForm;
