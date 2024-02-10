import {
    FormControl,
    FormHelperText,
    IconButton,
    InputAdornment,
    InputLabel,
    OutlinedInput,
} from "@mui/material";
import {Visibility, VisibilityOff} from "@mui/icons-material";
import {useState} from "react";


const PasswordField = ({
                           name,
                           helperText,
                           label = "",
                           error=false,
                           fullwidth = false,
                           required = false,
                           ...props
                       }) => {
    const [showPassword, setShowPassword] = useState(false);
    const handleClickShowPassword = () => setShowPassword(true);
    const handleMouseDownPassword = () => setShowPassword(false);
    return <FormControl variant="outlined" fullWidth={fullwidth} sx={{width: "100%"}} required={required}>
        <InputLabel htmlFor={`${name}-field-id`} error={error}>{label}</InputLabel>
        <OutlinedInput name={name}
            id={`${name}-field-id`} label={label}
            endAdornment={
                <InputAdornment position="end">
                    <IconButton aria-label="toggle password visibility" onClick={handleClickShowPassword}
                                onMouseDown={handleMouseDownPassword} edge="end">
                        {showPassword ? <VisibilityOff/> : <Visibility/>}
                    </IconButton>
                </InputAdornment>
            }
            {...props}
            type={showPassword ? 'text' : 'password'}
            required={required}
        />
        <FormHelperText error={error}>{helperText}</FormHelperText>
    </FormControl>
}

export default PasswordField;
