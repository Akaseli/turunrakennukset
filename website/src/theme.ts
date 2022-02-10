import { createTheme } from "@mui/material";
import { blue, red } from "@mui/material/colors";

const theme = createTheme({
    palette: {
        primary: {
            main: '#000000',
        },
        secondary: {
            main: blue.A400
        },
        error: {
            main: red.A400
        }
    }
});

export default theme;