import React from "react";
import {Stack, TableCell, TableRow} from "@mui/material";
import RenderFormField from "./RenderFormField";

const Filter = ({
                    columns,
                    onChange,
                }) => {
    return <TableRow>
        {columns.map((col, index) => <TableCell key={index}>
            {col.filter && <>
                {Array.isArray(col.filter) ? <Stack spacing={1.5} direction="column">
                        {col.filter.map((column, i) => <RenderFormField key={"filter-" + index + "-" + i} size="small"
                                                                        field={column} onchange={onChange}/>)}
                    </Stack> :
                    <RenderFormField key={"filter-" + index} field={col.filter} onchange={onChange} size="small"/>}
            </>}
        </TableCell>)}
    </TableRow>;
}

export default Filter;
