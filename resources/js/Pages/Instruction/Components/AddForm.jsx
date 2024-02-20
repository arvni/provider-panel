import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import {
    DialogActions,
    DialogContent,
    IconButton,
    Input,
    ListItem,
    ListItemSecondaryAction,
    TextField
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import {RemoveRedEye} from "@mui/icons-material";
import ListItemText from "@mui/material/ListItemText";
import List from "@mui/material/List";

const AddForm = ({values, setValues, submit, open, setOpen, title, loading, reset}) => {
    const handleChange = (e) => setValues(prevState => ({...prevState, [e.target.name]: e.target.value}));
    const handleFileChange = (e) => setValues(prevState => ({...prevState, [e.target.name]: e.target.files[0]}));
    const handleClose = () => {
        setOpen(false);
        reset();
    }
    return <Dialog open={open && !loading} onClose={handleClose}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent sx={{p: "1em"}}>
            <Container>
                <Grid container sx={{marginTop: "1em"}} spacing={2}>
                    <Grid item xs={12}>
                        <TextField label="Title" name="name" onChange={handleChange} value={values.name}/>
                    </Grid>
                    <Grid item xs={12}>
                        {typeof values.file == "string" && values.file ? <List>
                            <ListItem>
                                <ListItemText>File</ListItemText>
                                <ListItemSecondaryAction>
                                    <IconButton href={route("file", {id: values.id, type: "instruction"})}
                                                target="_blank"><RemoveRedEye/></IconButton>
                                </ListItemSecondaryAction>
                            </ListItem></List> : null}
                        <Input type="file" name="file" onChange={handleFileChange}/>
                    </Grid>
                </Grid>
            </Container>
        </DialogContent>
        <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={submit} variant="contained">Submit</Button>
        </DialogActions>

    </Dialog>
}

export default AddForm;
