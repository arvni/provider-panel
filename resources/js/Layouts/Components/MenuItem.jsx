import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import React, {useState} from "react";
import {Avatar, Collapse} from "@mui/material";
import {ExpandLess, ExpandMore} from "@mui/icons-material";
import List from "@mui/material/List";

const listItemStyle = {
    "&.Mui-selected": {
        color: "#fff",
        backgroundColor: "#29d",
        "&:hover": {
            fontWeight: "900",
            color: "rgba(0,0,0)",
            backgroundColor: "#29d8",
            "& svg": {
                fill: "rgb(0,0,8)",
                fontSize: "2em"
            }
        },
        "& svg": {
            fill: "#fff",
        }
    }
};

const renderListItems = (item, index, permissions, onClick) => {
    if (item.hasOwnProperty("child") && permissions.includes(item.permission))
        return <MenuItem key={index} permissions={permissions} onClick={onClick} {...item}/>
    return permissions.includes(item.permission) ?
        <ListItemButton key={index} sx={{pl: 4, listItemStyle}}
                        selected={route().current(item.route)}
                        href={item.route}
                        onClick={onClick(item.route)}>
            <ListItemIcon sx={{minWidth: "35px"}}>
                {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.title}/>
        </ListItemButton> : null;
}

const MenuItem = ({onClick, permissions, ...props}) => {
    const [open, setOpen] = useState(false);
    const handleClick = (route) => (e) => {
        if (e) {
            e.preventDefault();
        }
        if (route)
            onClick(route)();
        else
            setOpen(!open);
    }
    return <React.Fragment>
        <ListItemButton {...props} sx={listItemStyle}
                        onClick={handleClick(props.route)}
                        href={props.route}>
            <ListItemIcon sx={{minWidth: "60px"}}>
                {props.icon ?? <Avatar variant={"square"} sx={{ width: 24, height: 24 ,fontSize:".75rem",backgroundColor:"white",color:"gray"}} >{props.title}</Avatar>}
            </ListItemIcon>
            <ListItemText primary={props.title}/>
            {props.child && (open ? <ExpandLess/> : <ExpandMore/>)}
        </ListItemButton>
        {props.child && <Collapse in={open} timeout="auto" unmountOnExit>
            <List component="div">
                {props.child.map((item, index) => renderListItems(item, index, permissions, handleClick))}
            </List>
        </Collapse>}
    </React.Fragment>;
}
export default MenuItem;
