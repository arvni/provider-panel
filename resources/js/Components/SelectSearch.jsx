import React, {useEffect, useState, useRef} from "react";
import {Autocomplete, TextField} from "@mui/material";
import axios from "axios";


const SelectSearch = ({
                          value,
                          onchange,
                          name = "",
                          url = "",
                          helperText = "",
                          label = "",
                          error = false,
                          required = false,
                          disabled = false,
                          multiple = false
                      }) => {
    const ref = useRef();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const handleSearch = (e) => {
        setLoading(true);
        axios.get(url, {data: {search: e.target.value}}).then((result) => {
            setData(result.data.data);
            setLoading(false);
        });
    }
    const handleChange = (_, value) => onchange({target: {name, value}});

    return <Autocomplete
        ref={ref}
        defaultValue={value}
        onChange={handleChange}
        options={data}
        fullWidth
        multiple={multiple}
        disabled={disabled}
        getOptionLabel={(option) => option.name}
        loading={loading}
        renderInput={(params) => <TextField {...params} helperText={helperText} error={error} label={label}
                                            required={required} onChange={handleSearch}/>}
    />;
}
export default SelectSearch;
