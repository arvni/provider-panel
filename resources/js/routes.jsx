import React from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupsIcon from "@mui/icons-material/Groups";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import VaccinesSharpIcon from "@mui/icons-material/VaccinesSharp";
import MailIcon from "@mui/icons-material/Mail";
import DynamicFormIcon from "@mui/icons-material/DynamicForm";
import BiotechIcon from '@mui/icons-material/Biotech';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import VaccinesIcon from '@mui/icons-material/Vaccines';


const routes = [
    {
        title: "Dashboard",
        route: route('dashboard'),
        icon: <DashboardIcon/>
    },
    {
        title: "Orders",
        route: route("orders.index"),
        icon: <AssignmentIcon/>,
    },
    {
        title: "Order Materials",
        route: route("orderMaterials.index"),
        icon: <VaccinesIcon/>,
    },
    {
        title: "Tests List",
        route: route("tests.index"),
        icon: <BiotechIcon/>,
    },
    {
        title: "Admin",
        permission: 'Admin',
        icon: <ManageAccountsIcon/>,
        child: [
            {
                title: "Order Materials",
                route: route("admin.orderMaterials.index"),
                permission: 'Admin.OrderMaterial.Index',
                icon: <VaccinesIcon/>,
            },
            {
                title: "Collect Requests",
                route: route("admin.collectRequests.index"),
                permission: 'Admin.CollectRequest.Index',
                icon: <LocalShippingIcon/>,
            },
            {
                title: "Tests",
                route: route("admin.tests.index"),
                permission: 'Admin.Test.Index',
                icon: <BiotechIcon/>,
            },
            {
                title: "Sample Types",
                route: route("admin.sampleTypes.index"),
                permission: 'Admin.SampleType.Index',
                icon: <VaccinesSharpIcon/>,
            },
            {
                title: "Order Forms",
                route: route("admin.orderForms.index"),
                permission: 'Admin.OrderForm.Index',
                icon: <DynamicFormIcon/>,
            },
            {
                title: "Consent Forms",
                route: route("admin.consents.index"),
                permission: 'Admin.Consent.Index',
                icon: <MailIcon/>,
            },
            {
                title: "Consent Terms",
                route: route("admin.consentTerms.index"),
                permission: 'Admin.ConsentTerm.Index',
                icon: <PlaylistAddCheckIcon/>,
            },
            {
                title: "Users List",
                route: route("admin.users.index"),
                permission: 'Admin.User.Index',
                icon: <GroupsIcon/>,
            },
            {
                title: "Add New User",
                route: route("admin.users.create"),
                permission: 'Admin.User.Create',
                icon: <PersonAddIcon/>
            },
            {
                title: "Roles",
                route: route("admin.roles.index"),
                permission: 'Admin.Role.Index',
                icon: <AdminPanelSettingsIcon/>
            },

            {
                title: "Permissions",
                route: route("admin.permissions.index"),
                permission: 'Admin.Permission.Index',
                icon: <LockPersonIcon/>
            }
        ]
    },
];
export default routes;
