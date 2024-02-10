import {Button, CircularProgress} from "@mui/material";
import React from "react";

const LoadingButton = ({loading, children, ...rest}) => {
    return <Button disabled={loading} startIcon={loading ? <CircularProgress size="1em"/> : null} {...rest}>
        {children}
    </Button>
}
export default LoadingButton
