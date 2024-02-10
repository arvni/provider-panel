import {Grid} from "@mui/material";
import logo from "@/../images/logo.png";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export default function GuestLayout({children}) {

    return (
        <Container sx={{
            minHeight: "calc(100dvh - 50px)",
            display: "flex",
            alignContent: "center",
            justifyItems: "center",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "700px"
        }} maxWidth="700px">
            <Paper elevation={10} sx={{padding: "50px", borderRadius: "20px", bgcolor:"#e7e7e7"}}>
                <Grid container
                      direction="row"
                      justifyContent="center"
                      spacing={5}>
                    <Grid item
                          xs={12}
                          md={5}
                          sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-evenly",
                              flexDirection: "column",
                              gap: "50px"
                          }}>
                        <img src={logo}
                             alt="Bion Genetic Lab"
                             width="100%"/>
                        <Typography variant="h1"
                                    fontSize="25px"
                                    fontWeight="bold"> Provider Panel</Typography>
                    </Grid>
                    <Grid item xs={12} md={7}>
                        {children}
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
}
