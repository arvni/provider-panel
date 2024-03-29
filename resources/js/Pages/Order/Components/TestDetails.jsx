import {Dialog, DialogActions, DialogContent, DialogTitle, Typography} from "@mui/material";
import Button from "@mui/material/Button";

const TestDetails = ({test, open = false, onClose}) => {
    return <Dialog open={open} onClose={onClose}>
        <DialogTitle>{test?.name}</DialogTitle>
        <DialogContent>
            <Typography fontWeight="800">Description :</Typography>
            <div dangerouslySetInnerHTML={{__html:test?.description}}></div>
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
            {test?.instruction_file && <Button variant="outlined"
                                         href={route("file", {type: "instruction", id: test?.instruction_id})}
                                         target="_blanke">Download Instruction</Button>}
        </DialogActions>
    </Dialog>
}
export default TestDetails;
