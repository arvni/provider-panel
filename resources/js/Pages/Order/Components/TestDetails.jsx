import {Dialog, DialogActions, DialogContent, DialogTitle, Typography} from "@mui/material";
import Button from "@mui/material/Button";

const TestDetails = ({test, open = false, onClose}) => {
    return <Dialog open={open} onClose={onClose}>
        <DialogTitle>{test?.name}</DialogTitle>
        <DialogContent>
            <Typography fontWeight="800">Description :</Typography>
            <Typography>{test?.description}</Typography>
            <Typography fontWeight="800">Accepted Sample requirements :</Typography>
            <ul>
                {test?.sample_types?.map(sampleType => <li>
                    <strong>{sampleType.sample_type.name}: </strong>{sampleType?.description}</li>)}
            </ul>
        </DialogContent>
        <DialogActions>
            {test?.order_form_file && <Button variant="outlined"
                                            href={route("file", {type: "orderForm", id: test?.order_form_id})}
                                            target="_blanke">Download Order Form</Button>}
            {test?.consent_file && <Button variant="outlined"
                                         href={route("file", {type: "consent", id: test?.consent_id})}
                                         target="_blanke">Download Consent Form</Button>}
        </DialogActions>
    </Dialog>
}
export default TestDetails;
