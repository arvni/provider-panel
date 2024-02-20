import React, {useEffect, useState} from 'react';
import {Head, usePage, useRemember} from "@inertiajs/react";
import {createTheme, ThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Paper from "@mui/material/Paper";
import {Backdrop, CircularProgress} from "@mui/material";
import Drawer from './Components/Drawer';
import Copyright from './Components/Copyright';
import Header from './Components/Header';

const mdTheme = createTheme();

export default function Authenticated({auth, breadcrumbs, children}) {
    const [open, setOpen] = useRemember(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.addEventListener('inertia:start', function () {
            setLoading(true);
        })
        document.addEventListener('inertia:finish', function () {
            setLoading(false)
        })
    }, []);
    const toggleDrawer = () => {
        setOpen(!open);
    };

    return (
        <ThemeProvider theme={mdTheme}>
            <Box sx={{display: 'flex'}}>
                <CssBaseline/>
                <Header breadcrumbs={breadcrumbs}
                        toggleDrawer={toggleDrawer}
                        auth={auth}
                        open={open}/>

                <Drawer open={open}
                        toggleDrawer={toggleDrawer}
                        auth={auth}/>
                <Box
                    component="main"
                    sx={{
                        backgroundColor: (theme) =>
                            theme.palette.mode === 'light'
                                ? theme.palette.grey[100]
                                : theme.palette.grey[900],
                        flexGrow: 1,
                        height: 'calc(100dvh - 55px)',
                        overflow: 'auto',
                    }}
                >
                    <Toolbar/>
                    <Container sx={{mt: 4, mb: 4}} maxWidth={false}>
                        <Paper elevation={12} sx={{p: 5, borderRadius: "1em"}}>
                            {children}
                        </Paper>
                    </Container>
                </Box>
            </Box>
            <Copyright sx={{pt: 4}}/>
            <Backdrop open={loading} sx={{zIndex: mdTheme.zIndex.modal + 1}}>
                <CircularProgress color="info"/>
            </Backdrop>
        </ThemeProvider>
    );
}
