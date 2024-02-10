import Dialog from "@mui/material/Dialog";
import DialogTitle  from "@mui/material/DialogTitle";
import DialogContent  from "@mui/material/DialogContent";
import DialogContentText  from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { GridToolbar } from "@mui/x-data-grid";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";

const DeleteForm = ({title,agreeCB,disAgreeCB,openDelete}) => {



    return (
        <Dialog components={{ Toolbar: GridToolbar }} open={openDelete} onClose={disAgreeCB} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description" >
                <DialogTitle id="alert-dialog-title">
                    <ReportProblemIcon color='red'/>
                    </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description"> {`Do you want to Delete the ${title} ?`}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button color="secondary" onClick={disAgreeCB}>No</Button>
                    <Button variant="contained" color="success" onClick={agreeCB} autoFocus>Yes</Button>
                </DialogActions>
            </Dialog>
     );
}

export default DeleteForm;
