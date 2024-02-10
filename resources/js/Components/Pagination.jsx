import React from "react";
import {Pagination as MuiPagination} from "@mui/material";


const Pagination = ({paginate, onChange}) => {

    return (
        <MuiPagination page={paginate.current_page} count={paginate.last_page} onChange={onChange} sx={{mx: "auto"}}/>
    );
};

export default Pagination;
