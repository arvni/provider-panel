import {styled} from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import React from "react";
import {router} from "@inertiajs/react";
import ListMenuItem from "@/Layouts/Components/MenuItem.jsx";
import routes from "@/routes";

const drawerWidth = 260;

const StyledDrawer = styled(MuiDrawer, {shouldForwardProp: (prop) => prop !== 'open'})(
    ({theme, open}) => ({
        '& .MuiDrawer-paper': {
            position: 'relative',
            whiteSpace: 'nowrap',
            width: drawerWidth,
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
            boxSizing: 'border-box',
            ...(!open && {
                overflowX: 'hidden',
                transition: theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                }),
                width: theme.spacing(7),
                [theme.breakpoints.up('sm')]: {
                    width: theme.spacing(9),
                },
            }),
        },
    }),
);

const renderMenu = (item, index, permissions, handleVisit) => {
    return (!item?.permission || permissions.includes(item.permission)) ?
        <ListMenuItem key={index} permissions={permissions} onClick={handleVisit} {...item}/> : null
}

const Drawer = ({toggleDrawer,auth, open}) => {
    const handleVisit = (addr) => e => {
        router.visit(addr, {
            preserveState: true
        })
    };
    return <StyledDrawer  variant="permanent" open={open}>
        <Toolbar
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: [1],
            }}
        >
            <h3>Bion Providers Panel</h3>
            <IconButton onClick={toggleDrawer}>
                <ChevronLeftIcon/>
            </IconButton>
        </Toolbar>
        <Divider/>
        <List component="nav" sx={{maxHeight: "100%", overflowX: "hidden", overflowY: "auto"}}>
            {routes.map((item, index) => renderMenu(item, index, auth.permissions, handleVisit))}
        </List>
    </StyledDrawer>;
}

export default Drawer;
