import {Stack} from "@mui/material";
import React from "react";

const Actions = ({actions}) => {
    return <Stack direction="row" alignItems="center" spacing={2} justifyContent="end">
        {Array.isArray(actions) ? actions.map((item, index) => <React.Fragment
            key={index}>{item}</React.Fragment>) : actions}
    </Stack>
}

export default Actions;
