import React from "react";
import {FormControl, InputLabel, MenuItem, Select} from "@mui/material";


const PageSize = ({defaultValue = 10, onChange}) => {

    const handleChange = (e) => {
        onChange(e.target.value);
    }

    return <FormControl fullWidth>
        <InputLabel id="page-size-label">Per Page</InputLabel>
        <Select
            labelId="page-size-label"
            id="page-size"
            defaultValue={defaultValue}
            label="Per Page"
            onChange={handleChange}
        >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
        </Select>
    </FormControl>
}
export default PageSize;
