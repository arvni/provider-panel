import React, {useState} from "react";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography
} from "@mui/material";
import TestDetails from "./TestDetails";

const TestCard = (props) => {
    const [selected, setSelected] = useState(props.selected);
    const [open, setOpen] = useState(false);
    const handleSelect = () => {
        setSelected(!selected);
        if (props.test.id)
            props.onSelect(props.test.id);
    }
    const handleOpenDetails = () => setOpen(true);
    const handleCloseDetails = () => setOpen(false);
    return <><Card sx={{minWidth: 275, width: "100%"}} elevation={5}>
        <CardHeader disableTypography
                    title={<Stack direction="row" alignItems="center"
                                  justifyContent="space-between">
                        <Typography>Test</Typography>
                        <Stack direction="row" spacing={1}>
                            <Button onClick={handleOpenDetails}>Read more</Button>
                            <Button onClick={handleSelect}
                                    variant={selected ? "outlined" : "contained"}>{selected ? "unselect" : "Select"}</Button>
                        </Stack>
                    </Stack>}
        />
        <CardContent>
            <Typography component="h3" sx={{fontWeight: "bolder"}}>{props.test.name}</Typography>
            <Typography>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>TAT:</TableCell>
                            <TableCell>{props.test.turnaroundTime} business days</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Typography>
        </CardContent>
    </Card>
        <TestDetails test={props.test} open={open} onClose={handleCloseDetails}/>
    </>
}
export default TestCard;
