import {
    Alert,
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

import AddRequirementForm from "./AddRequirementForm";
import {makeId} from "@/services/makeUUID";

const RequirementForm = ({errors, requirements, onChange}) => {
    const [requirement, setRequirement] = useState({
        id: makeId(6),
        label: "",
        type: "text",
        required: true,
        options: [],
        value: ""
    });
    const handleAddRequirement = () => {
        let newRequirements = [...requirements ?? []];
        let index = newRequirements.findIndex((item) => item.id == requirement.id);
        if (index == -1)
            newRequirements.push(requirement);
        else
            newRequirements.splice(index, 1, requirement);
        onChange(newRequirements);
        handleCloseRequirement();
    }
    const handleCloseRequirement = () => {
        setOpenAddRequirement(false);
        resetRequirement();
    };
    const handleRequirementChange = (key, value) => {
        setRequirement((prevState) => ({...prevState, [key]: value}));
    }
    const resetRequirement = () => {
        setRequirement({
            id: makeId(6),
            label: "",
            type: "text",
            required: true,
            options: "",
            value: ""
        });
    }
    const [openAddRequirement, setOpenAddRequirement] = useState(false);

    const handleAddNewRequirement = () => {
        setOpenAddRequirement(true);
    }

    const handleEditRequirement = (index) => () => {
        requirements ? setRequirement({...requirements[index]}) : null;
        handleAddNewRequirement();
    }
    const handleDeleteRequirement = (index) => () => {
        let newRequirements = [...requirements ?? []];
        newRequirements.splice(index, 1);
        onChange(newRequirements);
    }

    return <>
        <Grid item sx={{width: "100%"}}>
            <List>
                <ListItem
                    secondaryAction={
                        <IconButton edge="end" aria-label="add Requirement"
                                    onClick={handleAddNewRequirement}
                                    color="success">
                            <AddIcon fontSize="large"/>
                        </IconButton>
                    }>
                    <ListItemText primary={<h3>Fields</h3>} />
                </ListItem>
                {requirements?.map((requirement, index) => (
                    <ListItem key={requirement.id}
                              secondaryAction={
                                  <Stack direction="row" spacing={1}>
                                      <IconButton color="warning"
                                                  onClick={handleEditRequirement(index)}>
                                          <Edit/>
                                      </IconButton>
                                      <DeleteButton onConfirm={handleDeleteRequirement(index)}/>
                                  </Stack>
                              }
                              disablePadding
                    >
                        <ListItemAvatar>
                            <h3>{index + 1}</h3>
                        </ListItemAvatar>
                        <ListItemText primary={requirement.label}
                                      secondary={<Stack direction="row" spacing={5}>
                                          <span>
                                              <strong>Type: </strong>
                                              {requirement.type}
                                          </span>
                                          {requirement?.options?.length ? <span>
                                              <strong>options: </strong>
                                              {requirement.options.join(", ")}</span>:null}
                                      </Stack>}
                        />
                    </ListItem>))}
            </List>
        </Grid>
        <AddRequirementForm data={requirement}
                            setData={handleRequirementChange}
                            open={openAddRequirement}
                            onClose={handleCloseRequirement}
                            onSubmit={handleAddRequirement}/>
    </>

}
export default RequirementForm;
