import UserForm from "@/Pages/User/Components/Form";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import {useEffect, useState} from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, useForm} from "@inertiajs/react";

const Add = (props) => {
    const {data, setData, post, processing} = useForm({
        name: "",
        mobile: "",
        email: "",
        roles: [],
        password: "",
        password_confirmation: "",
        meta: {
            contact: {
                address: "",
                city: "",
                country: "",
                email: "",
                name: "",
                phone:""
            },
            billing: {
                address: "",
                city: "",
                country: ""
            }
        }
    });
    const [errors, setErrors] = useState({});
    useEffect(() => {
        if (Object.keys(props.errors).length)
            setErrors(props.errors);
    }, [props.errors]);
    const handleSubmit = () => post(route('admin.users.store'));
    const handleCancel = () => router.visit(route('admin.users.index'));
    return (
        <>
            <UserForm values={data} errors={errors} setValues={setData} loading={processing} submit={handleSubmit}
                      cancel={handleCancel}/>
            <Backdrop sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}} open={processing}>
                <CircularProgress color="inherit"/>
            </Backdrop>
        </>
    );
}

const breadCrumbs = [
    {
        title: "Users",
        link: "/admin/users",
        icon: null
    },
    {
        title: "Add New User",
        link: null,
        icon: null
    }
]
Add.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Add;
