import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";

const AddButton=({onClick,title})=>{
    return <><Fab onClick={onClick} aria-label={title} sx={{
        position: 'absolute',
        bottom: 16,
        right: 16,
    }} color={"success"}>
        <AddIcon/>
    </Fab>

    </>;
}
export default AddButton;
