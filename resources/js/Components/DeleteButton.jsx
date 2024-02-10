import {
    Alert,
    Button,
    Card,
    CardActions,
    CardContent,
    CircularProgress,
    IconButton,
    Popper,
} from "@mui/material";
import {Delete as DeleteIcon} from "@mui/icons-material";
import React, {useState} from "react";
import {useDelete} from "@/services/api";


const DeleteButton = ({url , onConfirm }) => {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const {submit, processing: loading} = useDelete();

    const handleOpenDelete = (event) => {
        setAnchorEl(event.currentTarget);
        setShowConfirmation(true);
    }
    const handleCloseDelete = (event) => {
        setAnchorEl(null);
        setShowConfirmation(false);
    }

    const handleDelete = (e) => {
        if (onConfirm)
            onConfirm();
        else if(url)
            submit(url);
    }
    return <>
        <IconButton color="error" onClick={handleOpenDelete}>
            {loading ? <CircularProgress size={25}/> : <DeleteIcon/>}
        </IconButton>
        <Popper open={showConfirmation && !loading} anchorEl={anchorEl} placement={"top-start"} modifiers={[{
            name: 'arrow',
            enabled: true,
            options: {
                element: anchorEl,
            },
        }]} sx={{zIndex: theme => theme.zIndex.modal + 10}}>
            <Card sx={{minWidth: 275}}>
                <CardContent>
                    <Alert severity={"warning"}>
                        Do You Agree With Deleting This ?
                    </Alert>
                </CardContent>
                <CardActions>
                    <Button size="small" onClick={handleDelete}>Yes</Button>
                    <Button size="small" onClick={handleCloseDelete}>No</Button>
                </CardActions>
            </Card>
        </Popper>

    </>;
}

export default DeleteButton;
