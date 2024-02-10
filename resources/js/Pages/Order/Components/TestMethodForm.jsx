import React, {useEffect, useState} from "react";
import {
    Box,
    Button,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Paper,
    Stack,
    Typography
} from "@mui/material";
import {Close, ShoppingCart} from "@mui/icons-material";

import {useGetData} from "@/services/api";
import TestCard from "./TestCard";
import TestSearchForm from "./TestSearchForm";

const TestMethodForm = (props) => {
    const [tests, setTests] = useState([]);
    const {getData, loading} = useGetData();
    useEffect(() => {
        handleTestSearch({})
    }, []);
    const handleTestSearch = (values) => getData(route("api.tests.list"), values).then(res => setTests(res.data));
    const toggleSelect = (id) => {
        let tmp = [...props.tests];
        let orderIndex = props.tests.findIndex((item) => item.id === id);
        if (orderIndex !== -1) {
            tmp.splice(orderIndex, 1);
        } else {
            let testIndex = tests.findIndex((item) => item.id === id);
            if (testIndex !== -1 && tests[testIndex]) {
                tmp.push(tests[testIndex]);
            }
        }
        props.onChange("tests", tmp);
        return handleTestSearch({});
    }
    const handleDeleteTest = (id) => () => {
        if (id !== undefined)
            toggleSelect(id)
    };
    return <>
        <TestSearchForm onSearch={handleTestSearch}/>
        <Divider sx={{my: "2em"}}/>
        <Grid container spacing={2}>
            <Grid item
                  xs={7}
                  sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "column",
                      gap: 2
                  }}>
                {!loading ? tests.map((test) => <TestCard key={test.id}
                                                                selected={props.tests?.findIndex((item) => item.id === test.id) !== -1}
                                                                test={test} onSelect={toggleSelect}/>) :
                    <CircularProgress/>}
            </Grid>
            <Grid item xs={5}>
                <Box component="form" onSubmit={props.onSubmit}>
                <Paper sx={{p: "1rem"}} elevation={5}>
                    <Stack direction="row" justifyContent={"space-between"} alignItems={"center"}>
                        <Typography>Product List({props.tests.length} selected)</Typography>
                        <Button
                            disabled={!props.tests.length}
                            variant="outlined"
                            type="submit"
                            startIcon={<ShoppingCart/>}
                        >Order Now</Button>
                    </Stack>
                </Paper>
                <Paper sx={{p: "1rem"}}>
                    <List>
                        {props.tests.map((test) => <ListItem key={"test-" + test.id}>
                            <ListItemText>
                                <Paper elevation={4}
                                       sx={{padding: 2}}>
                                    <h3>{test.name}</h3>
                                </Paper>
                            </ListItemText>
                            <ListItemSecondaryAction>
                                <IconButton onClick={handleDeleteTest(test.id)}><Close/></IconButton>
                            </ListItemSecondaryAction>
                            <Divider/>
                        </ListItem>)}
                    </List>
                </Paper>
            </Box>
            </Grid>
        </Grid>
    </>;
}
export default TestMethodForm;
