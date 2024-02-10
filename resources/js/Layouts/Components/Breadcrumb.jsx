import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import {Head, Link} from "@inertiajs/react";
import HomeIcon from "@mui/icons-material/Home.js";
import React from "react";

export default function Breadcrumb({breadcrumbs}) {
    return (<>
        <Breadcrumbs aria-label="breadcrumb" sx={{color:"#fff"}}>
            {route().current("dashboard")? <Typography sx={{ display: 'flex', alignItems: 'center', Color:"#fff" }}>Dashboard</Typography>:<Link method="get" href="/dashboard" type="button"  style={{textDecoration:"none",color:"#fff", fill:"#fff"}}>
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Dashboard
            </Link>}
            {breadcrumbs.map((item, index)=>item.link?(
                <Link method="get" key={index} href={item.link} type="button" style={{textDecoration:"none",color:"#fff", fill:"#fff"}}>
                    {item.icon??null} {item.title}
                </Link>
            ):(
                <Typography key={index} sx={{ display: 'flex', alignItems: 'center', Color:"#fff" }}>
                    {item.title}
                </Typography>))}
        </Breadcrumbs>
        <Head title={breadcrumbs.length?breadcrumbs[breadcrumbs.length-1].title:"Dashboard"}/>
    </>);
}
