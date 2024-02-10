import {
    FormControlLabel,
    Input,
    List,
    ListItem,
    ListItemAvatar,
    ListItemSecondaryAction,
    ListItemText, Stack
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import {Delete, UploadFile} from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";

const FileUploader = ({title, onChange, name, defaultValues = []}) => {

    const handleChange = (e) => onChange(name, [...defaultValues, ...Array.from(e.target.files)])
    const handleDelete = (index) => () => {
        let tmp = [...defaultValues];
        tmp.splice(index, 1);
        onChange(name, tmp);
    };
    return <>
        <FormControlLabel labelPlacement="top" sx={{mt:2}}
                          label={<Box>
                              <Paper sx={{padding:2}}>
                                  <Stack direction="column" spacing={2}>
                                      <UploadFile fontSize="large"/>
                                      <Typography>{title}</Typography>
                                  </Stack>
                              </Paper>
                          </Box>}
                          control={<Input sx={{display: "none"}} type="file" multiple inputProps={{multiple: true}}/>}
                          name={name} onChange={handleChange}/>
        {defaultValues.length ? <List>
            {defaultValues.map((item, index) => <ListItem>
                <ListItemAvatar>{index + 1}</ListItemAvatar>
                <ListItemText><a href={typeof item === "string" ? ("/files/" + item) : URL.createObjectURL(item)}
                                 target="_blank">download</a></ListItemText>
                <ListItemSecondaryAction>
                    <IconButton onClick={handleDelete(index)} color="error"><Delete/></IconButton>
                </ListItemSecondaryAction>
            </ListItem>)}
        </List> : null}
    </>;
}
export default FileUploader;
