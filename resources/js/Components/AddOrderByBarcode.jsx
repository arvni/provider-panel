import {Box, Button, List, TextField} from "@mui/material";
import React, {useState} from "react";
import {useForm} from "@inertiajs/react";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import ListItemButton from "@mui/material/ListItemButton";
import Backdrop from "@mui/material/Backdrop";

const AddOrderByBarcode = () => {
    const [barcode, setBarcode] = useState();
    const [open, setOpen] = useState(false);
    const [tests, setTests] = useState([])
    const [loading, setLoading] = useState(false)
    const {
        reset,
        data,
        setData,
        errors,
        post,
        processing,
        clearErrors,
        setError
    } = useForm({barcode: ""});
    const handleAddOrder = (e) => {
        if (data.barcode)
            post(route("orders.create-by-barcode"));
        else
            setError("barcode", "Please Enter the barcode");
    };
    const handleChange = (e) => {
        setData("barcode", e.target.value);
        setBarcode(e.target.value);
    }
    const openTestList = (e) => {
        clearErrors();
        e.stopPropagation();
        e.preventDefault();
        if (barcode) {
            setOpen(true);
            fetchTests();
        }
        else
            setError("barcode", "Please Enter The Barcode");
    }
    const fetchTests = () => {
        setLoading(true);
        axios.get(route("tests-by-barcode", {barcode}))
            .then((res) => setTests(res.data.tests))
            .catch((res)=> {
                setError("barcode", res.response.data.message);
                setOpen(false);
            })
            .finally(()=>setLoading(false));
    }
    const handleTestSelect =(id)=> () => {
      let test=tests.find(item=>item.id==id);
      setData("test",test);
    }
    const handleClose = () => {
      setOpen(false);
      reset();
      setBarcode();
      setTests([]);
    }
    return <>
        <Box component="form"
                  onSubmit={openTestList}
                  sx={{display: "flex", gap: 5}}>
        <TextField error={errors.hasOwnProperty("barcode")}
                   label="Scan Barcode"
                   helperText={errors?.barcode}
                   onChange={handleChange}
                   value={data.barcode}/>
        <Button startIcon={processing ? <CircularProgress size="small"/> : null} type="submit" variant="contained">
            Add Order
        </Button>
    </Box>
        {loading?<Backdrop open><CircularProgress/></Backdrop>:<Dialog open={open} maxWidth="sm" fullWidth>
            <DialogTitle>Select Test</DialogTitle>
            <DialogContent>
                <List>
                    {tests.map(test => <ListItemButton
                        selected={data?.test?.id == test.id}
                        key={test.id} onClick={handleTestSelect(test.id)}>
                        {test.name}
                    </ListItemButton>)}
                </List>
            </DialogContent>
            <DialogContent>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={handleAddOrder}>Submit</Button>
            </DialogContent>
        </Dialog>}
    </>
}

export default AddOrderByBarcode;
