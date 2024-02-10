import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Paper from "@mui/material/Paper";
import {Table, TableBody, TableCell, TableHead, TableRow} from "@mui/material";
import {Download, RemoveRedEye} from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";

const Show = ({collectRequest}) => {

    return <>
        <Paper>

        </Paper>
        <Paper>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Tests</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Patient Name</TableCell>
                        <TableCell>#</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {collectRequest.orders.map(order => <TableRow key={order.id}>
                        <TableCell>{order.id}</TableCell>
                        <TableCell>{order.tests.map(test => test.name).join(", ")}</TableCell>
                        <TableCell>{order.status}</TableCell>
                        <TableCell>{order.patient.fullName}</TableCell>
                        <TableCell>
                            <IconButton href={route("order-summary", order.id)} target="_blank">
                                <Download/>
                            </IconButton>
                            <IconButton href={route("orders.show", order.id)} target="_blank">
                                <RemoveRedEye/>
                            </IconButton>
                        </TableCell>
                    </TableRow>)}
                </TableBody>
            </Table>
        </Paper>
    </>;
}

const breadCrumbs = [
    {
        title: "Collect Requests",
        link: "/admin/collectRequests",
        icon: null
    }
]
Show.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={[...breadCrumbs,
    {
        title: "Collect Request #"+page.props.collectRequest.id,
        link: null,
        icon: null
    }]}/>

export default Show;
