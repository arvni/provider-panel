import UserForm from "@/Pages/User/Components/Form";
import React, {useEffect, useState} from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, useForm} from "@inertiajs/react";
import {Autocomplete, Box, Button, Chip, Paper, Stack, TextField} from "@mui/material";
import PageHeader from "@/Components/PageHeader.jsx";
import AddIcon from "@mui/icons-material/Add.js";
import {Sync} from "@mui/icons-material";

const TestList = (props) => {
    const {data, setData, post, processing} = useForm({tests: props.user.tests, _method: "put"});
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        handleSearch()
    }, [])
    const handleSubmit = () => post(route('admin.users.tests.update', props.user.id));
    const handleDelete = (id) => () => {
        let index = data.tests.findIndex(item => item.id === id);
        if (index >= 0) {
            const temp = data.tests;
            temp.splice(index, 1);
            setData(previousData => ({...previousData, tests: temp}));
        }
    }
    const handleAdd = (e, v) => {
        if (v) {
            let test = v;
            let temp = data.tests;
            let index = temp.findIndex(item => item.id === test.id);
            if (index >= 0)
                temp.splice(index, 1);
            else
                temp.push(test);
            setData(previousData => ({...previousData, tests: temp}));
        }

        handleSearch(null,"")
    };
    const getStyle = (test) => {
        let index = data.tests.findIndex(item => item.id === test.id);
        if (index >= 0)
            return {background: "#f0f0f0"}
        return null;
    }
    const [search, setSearch] = useState("")
    const handleSearch = (_, search) => {
        setLoading(true);
        setSearch(search);
        axios.get(route("api.tests.list", {search}))
            .then(res => {
                setLoading(false)
                setTests(res.data.data);
            });
    }
    return <>
        <PageHeader title={props.user.name + " Tests List"}/>
        <Paper sx={{mt: "3em", p: "1rem"}}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
                {data.tests.map(test => <Chip label={test.name} variant="outlined"
                                              onDelete={handleDelete(test.id)}/>)}</Stack>
            <hr/>
            <Stack direction="row" spacing={2}>
                <Autocomplete
                    sx={{width: 300}}
                    options={tests}
                    autoHighlight
                    disableClearable
                    disableCloseOnSelect
                    disablePortal
                    dis
                    loading={loading}
                    getOptionLabel={(option) => option.name}
                    renderOption={(props, option) => {
                        return (
                            <Box key={option.id}
                                 component="li"
                                 {...props}
                                 sx={getStyle(option)}
                            >
                                {option.name}
                            </Box>
                        );
                    }}
                    value={null}
                    name="Test"
                    onChange={handleAdd}
                    onInputChange={handleSearch}
                    inputValue={search}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Choose a Test"
                            inputProps={{
                                ...params.inputProps,
                                autoComplete: 'new-password', // disable autocomplete and autofill
                            }}
                        />
                    )}
                />
                <Button onClick={handleSubmit}
                        variant="contained">Submit</Button>
            </Stack>
        </Paper>
    </>;
}

const breadCrumbs = [
    {
        title: "Users",
        link: "/admin/users",
        icon: null
    },
    {
        title: "Edit User Tests",
        link: null,
        icon: null
    }
]
TestList.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default TestList;
