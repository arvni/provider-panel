import {Box, Button, TextField} from "@mui/material";
import React from "react";
import {useForm} from "@inertiajs/react";
import CircularProgress from "@mui/material/CircularProgress";

const AddOrderByBarcode = () => {
    const {
        data,
        setData,
        errors,
        post,
        processing,
        clearErrors,
        setError
    } = useForm({barcode: ""});
    const handleAddOrder = (e) => {
        clearErrors();
        e.stopPropagation();
        e.preventDefault();
        if (data.barcode)
            post(route("orders.create-by-barcode"));
        else
            setError("barcode", "Please Enter the barcode");
    };
    const handleChange = (e) => setData("barcode", e.target.value)
    return <Box component="form"
                onSubmit={handleAddOrder}
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
}

export default AddOrderByBarcode;
