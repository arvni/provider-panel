import Typography from "@mui/material/Typography";
import {Link, useForm, useRemember} from "@inertiajs/react";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import AppBar from "@/Layouts/Components/AppBar";
import React from "react";
import Breadcrumb from "@/Layouts/Components/Breadcrumb";
import ChangePassword from "@/Pages/User/Components/ChangePassword";
import {changePasswordValidator} from "@/Services/validate";
import {useSnackbar} from "notistack";

export default function Header({toggleDrawer, auth, breadcrumbs, open}) {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [openChangePassword, setOpenChangePassword] = useRemember(false);
    const {enqueueSnackbar} = useSnackbar();
    const {data, setData, setError, errors, reset, post} = useForm({
        current: "",
        password: "",
        password_confirmation: "",
        _method: "put"
    });
    const changePassword = () => {
        if (changePasswordValidator(data, true, setError, auth.user))
            post(route("password.update"), {
                onSuccess: () => {
                    reset();
                    setOpenChangePassword(false);
                    enqueueSnackbar("Password Changed Successfully", {variant: "success"});
                }
            });
    }
    const handleCloseOpenChangePassword = () => {
        setOpenChangePassword(false);
        reset();
    }
    const handleOpenChangePassword = () => {
        setOpenChangePassword(true);
    }
    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return <>
        <AppBar position="absolute" open={open}>
            <Toolbar sx={{pr: '24px'}}>
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="open drawer"
                    onClick={toggleDrawer}
                    sx={{
                        marginRight: '36px',
                        ...(open && {display: 'none'}),
                    }}
                >
                    <MenuIcon/>
                </IconButton>
                <Typography
                    component="h1"
                    variant="h6"
                    color="inherit"
                    noWrap
                    sx={{flexGrow: 1}}
                >
                    <Breadcrumb breadcrumbs={breadcrumbs}/>
                </Typography>
                <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    color="inherit"
                >
                    <AccountCircle/>
                </IconButton>
                <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    <MenuItem onClick={handleClose}>{auth.user.name}</MenuItem>
                    <MenuItem onClick={handleOpenChangePassword}>Change Password</MenuItem>
                    <MenuItem>
                        <Link href={route('logout')} method="post"> Logout</Link>
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
        <ChangePassword setData={setData} data={data} setError={setError} errors={errors} onSubmit={changePassword}
                        currentNeeded={true} open={openChangePassword} onClose={handleCloseOpenChangePassword}/>
    </>
}
