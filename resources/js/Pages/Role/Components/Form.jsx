import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import {FormControlLabel, Switch} from "@mui/material";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

function renderPermissionGroup(permission, onChange, data, level = 0) {
    level += 1;
    if (!permission.hasOwnProperty("id")) {

        return Object.keys(permission).map(item => <Grid item
                                                         xs={[1, 2].includes(level) ? (Array.isArray(permission[item]) ? (permission[item].length * 4 > 12 ? 12 : permission[item].length * 4) : 12) : 3}>
            <>
                {item != 0 && level < 3 ?
                    <Divider sx={{marginTop: "1em"}}>
                        <Typography variant={"h" + level} fontSize={level == 1 ? "32px" : "24px"}> {item}</Typography>
                    </Divider> : null}

                {Object.keys(permission[item]).length === 1 ? renderPermissionGroup(permission[item], onChange, data, level) :
                    <Grid container spacing={1} sx={{marginBottom: "1em"}}>
                        {renderPermissionGroup(permission[item], onChange, data, level)}
                    </Grid>}
            </>
        </Grid>);
    }
    return <Grid item xs={12} key={permission.id}>
        <FormControlLabel value={permission.id}
                          checked={data.permissions.map(item => item.id).includes(permission.id)}
                          onChange={onChange} control={<Switch color="primary"/>}
                          label={permission.name} labelPlacement="start"/>
    </Grid>
}

export default function ({data, setData, submit, permissions, edit, cancel}) {
    const handlePermissionsChanged = (e) => {
        let tmp = data.permissions;
        if (e.target.checked) {
            tmp.push({id:e.target.value * 1});
        } else if (tmp && tmp.length) {
            let index = tmp.map(item=>item.id).indexOf(e.target.value * 1);
            if (index > -1)
                tmp.splice(index, 1);
        }
        setData(prevState => ({...prevState, permissions: tmp}));
    };
    const handleNameChanged = (e) => setData(prevState => ({...prevState, [e.target.name]: e.target.value}));
    return (
        <Container sx={{p: "1em"}}>
            <Typography variant="h4">{`${edit ? "Edit" : "Add New"} Role`}</Typography>
            <Divider sx={{my: "1em"}}/>
            <Grid container>
                <Grid>
                    <TextField value={data.name} name="name" label="Title" onChange={handleNameChanged}/>
                </Grid>
            </Grid>
            <Divider><Typography variant="h5">Permissions</Typography></Divider>
            <Grid container spacing={2} rowSpacing={2}>
                {renderPermissionGroup(permissions, handlePermissionsChanged, data)}
            </Grid>
            <Divider sx={{my: "1em"}}/>
            <Grid container flex justifyItems={"flex-end"} justifyContent={"flex-end"} spacing={2}>
                <Grid item>
                    <Button onClick={cancel}>Cancel</Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" onClick={submit}>Submit</Button>
                </Grid>
            </Grid>
        </Container>
    );
}
