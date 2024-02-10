import * as React from "react";
import {
    Checkbox,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from "@mui/material";

import PasswordField from "./PasswordField";
import SelectSearch from "./SelectSearch";


const FormField = ({
                       field: {type, ...rest},
                       size = "medium",
                       onchange,
                   }) => {
    switch (type) {
        case "textarea":
            return <TextField onChange={onchange} {...rest} multiline fullWidth size={size}/>
        case "text":
        case "email":
        case "number":
            return <TextField onChange={onchange} {...rest} type={type} fullWidth inputProps={{type}} size={size}/>
        case "date":
            return <TextField
                {...rest}
                id={rest.name + "-date"}
                defaultValue={rest.value}
                onChange={onchange}
                name={rest.name}
                type={"date"}
                label={rest.label}
                sx={{width: 220}}
                size={size}
                InputLabelProps={{
                    shrink: true,
                }}
            />
        case "password":
            return <PasswordField {...rest} onChange={onchange} fullwidth/>
        case "description":
            return <Typography>{rest.value||rest.label}</Typography>
        case "checkbox":
            return <FormControlLabel onChange={onchange}
                control={<Checkbox defaultChecked={rest.value} name={rest.name} size={size}/>}
                label={rest.label}/>
        case "selectSearch":
            return <SelectSearch onchange={onchange} url={rest?.url ?? ""} {...rest} size={size}/>
        case "select":
            return <FormControl fullWidth size={size}>
                <InputLabel id={`${rest.name}-select-label`}>{rest.label}</InputLabel>
                <Select labelId={`${rest.name}-select-label`} id={`${rest.name}-select`} {...rest} onChange={onchange}
                        size={size}>
                    {rest.options ? rest.options.map((option, index) => <MenuItem
                        value={typeof option === "string" ? option : option.value}
                        key={index}>{typeof option === "string" ? option : option.label}</MenuItem>) : null}
                </Select>
            </FormControl>;
    }
}
export default FormField;
