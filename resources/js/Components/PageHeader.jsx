import React from "react";
import {Grid, Paper, Stack, Typography} from "@mui/material";
import Actions from "./Actions";

const PageHeader = ({
                        title,
                        subtitle = "",
                        actions = []
                    }) => {
    return <Paper elevation={5} variant="elevation" sx={{p: "1em"}}>
        <Grid container direction="row" justifyContent="space-between" alignItems="center"
              alignContent="center">
            <Grid item>
                <Stack direction="column" spacing={2}>
                    <Typography variant="h1" fontSize="42px">{title}</Typography>
                    {subtitle && <Typography>{subtitle}</Typography>}
                </Stack>
            </Grid>
            <Grid item>
                {actions && <Actions actions={actions}/>}
            </Grid>
        </Grid>
    </Paper>;
}
export default PageHeader;
