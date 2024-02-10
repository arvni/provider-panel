import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import React, {useEffect, useState} from "react";
import FilterIcon from '@mui/icons-material/FilterAlt'
import Button from "@mui/material/Button";

// @todo change with SelectSearch

const Filter = ({defaultFilter, onFilter}) => {
    const [permissions, setPermissions] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState(defaultFilter);
    useEffect(() => {
        listPermissions();
    }, [search]);

    const handleSearch = (e) => setSearch(e?.target?.value ?? "");
    const listPermissions = async () => {
        setLoading(true);
        const {data} = await axios.get('/api/permissions/?search=' + search);
        setPermissions(data.data);
        setLoading(false);
    }
    const handleChange = (e) => {
        if (e.target.getAttribute("data-option-index")) {
            setFilter(prevState => ({
                ...prevState,
                permission: permissions[e.target.getAttribute("data-option-index")]
            }));
        } else if (e.target.name === "search")
            setFilter(prevState => ({...prevState, search: e.target.value}))
        else {
            setFilter(prevState => ({...prevState, permission: ""}));
            setSearch("");
        }
    };

    return (
        <Accordion>
            <AccordionSummary>
                <FilterIcon/>Filter
            </AccordionSummary>
            <AccordionDetails>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={5}>
                        <TextField sx={{width: "100%"}} name={"search"} value={filter?.search} onChange={handleChange}
                                   label={"Search title"}/>
                    </Grid>
                    <Grid item xs={12} sm={5}>
                        <Autocomplete name={"permission"}
                                      isOptionEqualToValue={(option, value) => option.id === value?.id}
                                      getOptionLabel={(option) => option?.name ?? ""} value={filter?.permission}
                                      onInputChange={handleSearch}
                                      onChange={handleChange} disablePortal options={permissions}
                                      renderInput={params => <TextField {...params} InputProps={{
                                          ...params.InputProps,
                                          endAdornment: (
                                              <React.Fragment>
                                                  {loading ? <CircularProgress color="inherit" size={20}/> : null}
                                                  {params.InputProps.endAdornment}
                                              </React.Fragment>
                                          ),
                                      }} label={"Permission"}/>} loading={loading}/>
                    </Grid>
                    <Grid item xs={12} sm={2} sx={{display: "flex"}} justifyContent={"center"}>
                        <Button variant={"outlined"} onClick={onFilter(filter)}>Filter</Button>
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    );
}

export default Filter;
