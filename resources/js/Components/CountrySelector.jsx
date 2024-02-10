import React from "react";
import {
    Autocomplete,
    autocompleteClasses,
    Box,
    Button,
    ClickAwayListener,
    InputBase,
    Popper,
    styled
} from "@mui/material";
import countries from "@/Data/countries";

const StyledAutocompletePopper = styled('div')(({theme}) => ({
    [`& .${autocompleteClasses.paper}`]: {
        boxShadow: 'none',
        margin: 0,
        color: 'inherit',
        fontSize: 13,
    },
    [`& .${autocompleteClasses.listbox}`]: {
        backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#1c2128',
        padding: 0,
        [`& .${autocompleteClasses.option}`]: {
            minHeight: 'auto',
            alignItems: 'flex-start',
            padding: 8,
            borderBottom: `1px solid  ${
                theme.palette.mode === 'light' ? ' #eaecef' : '#30363d'
            }`,
            '&[aria-selected="true"]': {
                backgroundColor: 'transparent',
            },
            [`&.${autocompleteClasses.focused}, &.${autocompleteClasses.focused}[aria-selected="true"]`]:
                {
                    backgroundColor: theme.palette.action.hover,
                },
        },
    },
    [`&.${autocompleteClasses.popperDisablePortal}`]: {
        position: 'relative',
    },
}));

function PopperComponent(props) {
    const {disablePortal, anchorEl, open, ...other} = props;
    return <StyledAutocompletePopper {...other} />;
}

const StyledPopper = styled(Popper)(({theme}) => ({
    border: `1px solid ${theme.palette.mode === 'light' ? '#e1e4e8' : '#30363d'}`,
    boxShadow: `0 8px 24px ${
        theme.palette.mode === 'light' ? 'rgba(149, 157, 165, 0.2)' : 'rgb(1, 4, 9)'
    }`,
    borderRadius: 6,
    width: 300,
    zIndex: theme.zIndex.modal,
    fontSize: 13,
    color: theme.palette.mode === 'light' ? '#24292e' : '#c9d1d9',
    backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#1c2128',
}));


const StyledInput = styled(InputBase)(({theme}) => ({
    padding: 10,
    width: '100%',
    borderBottom: `1px solid ${
        theme.palette.mode === 'light' ? '#eaecef' : '#30363d'
    }`,
    '& input': {
        borderRadius: 4,
        backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#0d1117',
        padding: 8,
        transition: theme.transitions.create(['border-color', 'box-shadow']),
        border: `1px solid ${theme.palette.mode === 'light' ? '#eaecef' : '#30363d'}`,
        fontSize: 14,
        '&:focus': {
            boxShadow: `0px 0px 0px 3px ${
                theme.palette.mode === 'light'
                    ? 'rgba(3, 102, 214, 0.3)'
                    : 'rgb(12, 45, 107)'
            }`,
            borderColor: theme.palette.mode === 'light' ? '#0366d6' : '#388bfd',
        },
    },
}));


const CountrySelector = ({value, onChange}) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    let pendingValue = countries.find(item => {
        if (item.phone.length <= value.length) {
            return (new RegExp(`^${item.phone}.*`)).test(value + "")
        }
        return false
    }) ?? null;
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        if (anchorEl) {
            anchorEl.focus();
        }
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'country-label' : undefined;
    const handleChange = (event,
                          newValue,
                          reason) => {
        if (
            event.type === 'keydown' &&
            event.key === 'Backspace' &&
            reason === 'removeOption'
        ) {
            return;
        }
        let output=value.replace(pendingValue?.phone ?? "", newValue?.phone ?? "");
        onChange(output);
        pendingValue = newValue;
        handleClose();
    }
    return <>
        <Button disableRipple aria-describedby={id} onClick={handleClick}>
            <img loading="lazy"
                 src={`https://flagcdn.com/w40/${pendingValue?.code?.toLowerCase()}.png`}
                 alt=""
            />
        </Button>
        <StyledPopper id={id} open={open} anchorEl={anchorEl} placement="bottom-start">
            <ClickAwayListener onClickAway={handleClose}>
                <div>
                    <Autocomplete
                        open
                        onClose={(
                            event,
                            reason,
                        ) => {
                            if (reason === 'escape') {
                                handleClose();
                            }
                        }}
                        value={pendingValue}
                        onChange={handleChange}
                        disableCloseOnSelect
                        PopperComponent={PopperComponent}
                        renderTags={() => null}
                        renderOption={(props, option, {selected}) => (
                            <Box component="li" sx={{'& > img': {mr: 2, flexShrink: 0}}} {...props}>
                                <img loading="lazy"
                                     width="20"
                                     alt={option.label}
                                     src={`https://flagcdn.com/w20/${option?.code?.toLowerCase()}.png`}
                                     srcSet={`https://flagcdn.com/w40/${option?.code?.toLowerCase()}.png 2x`}
                                />
                                {option.label}
                            </Box>
                        )}
                        options={countries}
                        getOptionLabel={(option) => option.label}
                        renderInput={(params) => (
                            <StyledInput
                                ref={params.InputProps.ref}
                                inputProps={params.inputProps}
                                autoFocus
                            />
                        )}
                    />
                </div>
            </ClickAwayListener>
        </StyledPopper>
    </>
}
export default CountrySelector;
