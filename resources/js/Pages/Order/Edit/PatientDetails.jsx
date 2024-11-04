import React, {useEffect, useState} from "react";
import {useSubmitForm} from "@/Services/api";
import PatientDetailsForm from "../Components/PatientDetailsForm";
import EditLayout from "../EditLayout";
import {patientDetailsValidate} from "@/Services/validate";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import {CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, TextField} from "@mui/material";


const PatientList = ({open, onClose, onSelect}) => {
    const [patientList, setPatientList] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        fetch();
    }, [open]);
    const handleChange = (e) => fetch(e.target.value)
    const fetch = (search) => {
        setLoading(true);
        axios.get(route("api.patients.list", {search}))
            .then(({data}) => setPatientList(data.data))
            .then(() => setLoading(false));
    }

    const handleSelect = id => () => {
        onSelect(patientList.find(item => item.id == id));
    }

    return <Dialog onClose={onClose} open={open} fullWidth maxWidth="md">
        <DialogTitle>
            Patient List
        </DialogTitle>
        <DialogContent>
            <TextField onChange={handleChange} sx={{mt: 1}} label="Search"/>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID No</TableCell>
                        <TableCell>Full Name</TableCell>
                        <TableCell>Reference ID</TableCell>
                        <TableCell>Date Of Birth</TableCell>
                        <TableCell>Nationality</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading ? <TableRow>
                        <TableCell colSpan={5} align="center">
                            <CircularProgress/>
                        </TableCell>
                    </TableRow> : patientList.map(item => <TableRow key={item.id}
                                                                    sx={{cursor: "pointer"}}
                                                                    onClick={handleSelect(item.id)}>
                        <TableCell>{item?.id_no}</TableCell>
                        <TableCell>{item?.fullName}</TableCell>
                        <TableCell>{item?.reference_id}</TableCell>
                        <TableCell>{item?.dateOfBirth}</TableCell>
                        <TableCell>{item?.nationality?.label}</TableCell>
                    </TableRow>)}
                </TableBody>
            </Table>
        </DialogContent>
    </Dialog>
}
const PatientDetails = ({auth, order, step, genders}) => {
    const {
        data,
        setData,
        submit,
        errors,
        setError,
        clearErrors,
    } = useSubmitForm({...order.patient, _method: "put"}, route("orders.update", {order: order.id, step}));
    const [openPatientList, setOpenPatientList] = useState(false)
    const handleChange = (key, value) => {
        setData(previousData => ({...previousData, [key]: value}))
    };
    const handleSubmit = () => {
        clearErrors();
        if (patientDetailsValidate(data, setError))
            submit();
    };
    const handlePatientListOpen = () => {
        setOpenPatientList(true)
    }
    const handlePatientListClose = () => setOpenPatientList(false)
    const handlePatientSelect = (patient) => {
        setData({...patient, _method: "put"});
        handlePatientListClose();
    }

    return (
        <EditLayout step={step} auth={auth} id={order.id}>
            <PatientDetailsForm patient={data}
                                genders={genders}
                                onChange={handleChange}
                                onSubmit={handleSubmit}
                                errors={errors}
                                handlePatientListOpen={handlePatientListOpen}/>
            <PatientList open={openPatientList}
                         onClose={handlePatientListClose}
                         onSelect={handlePatientSelect}/>
        </EditLayout>

    );
}
export default PatientDetails;
