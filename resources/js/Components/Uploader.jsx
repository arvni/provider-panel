import React, { useState} from "react";
import {
    Avatar,
    Box,
    IconButton,
    InputBase,
    LinearProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemSecondaryAction,
    ListItemText,
    Paper,
    Typography
} from "@mui/material";
import {Download, Upload} from "@mui/icons-material";
import {uploadFiles} from "@/Services/api";

const Uploader = ({value, name, handleChange, error, helperText, url, label}) => {
    const {upload, progress, resetProgress} = uploadFiles(url);
    const [files, setFiles] = useState(value ?? [])
    const handleDrop = async (e) => {
        stopDefault(e);
        setFiles(prevState => [...prevState, ...convertFileList(e.dataTransfer.files)]);
        await onUpload(e.dataTransfer.files)
    }
    const handleMouseEnter = (e) => {
        stopDefault(e);

    }
    const handleMouseOut = (e) => {
        stopDefault(e)
    }
    const stopDefault = (e) => {
        e.stopPropagation();
        e.preventDefault();
    }
    const handleUpload = async (e) => {
        if (e.target.files) {
            setFiles(prevState => [...prevState, ...convertFileList(e.target.files)]);
            await onUpload(e.target.files);
        }
    }
    const convertFileList = (fileList) => {
        let newFileList = [];
        if (fileList)
            for (let i = 0; i < fileList.length; i++) {
                newFileList.push({name: fileList[i].name, url: ""});
            }

        return newFileList;
    }

    const onUpload = async (fileList) => {
        for (let i = 0; i < fileList.length; i++) {
            try {
                let {data} = await upload(fileList[i]);
                let newFiles = [...files];
                if (newFiles[i + newFiles.length])
                    newFiles[i + newFiles.length].url = data.url;
                else
                    newFiles[i + newFiles.length] = {name: fileList[i].name, url: data.url}
                setFiles(newFiles);
                handleChange(name, newFiles);
                resetProgress()
            } catch (e) {
                let newFiles = [...files];
                if (newFiles[i + newFiles.length])
                    newFiles[i + newFiles.length].error = e.message;
                setFiles(newFiles);
            }
        }
    }

    return <Box sx={{minWidth: "200px",}}
                onDropCapture={handleDrop}
                onDrop={handleDrop}
                onDragEnter={handleMouseEnter}
                onDragOver={stopDefault}
                onDragLeave={handleMouseOut}>
        {label && <Typography>{label}</Typography>}
        <Paper elevation={2}
               sx={{
                   display: "flex",
                   flexDirection: "column",
                   gap: 2,
                   alignItems: "center",
                   justifyContent: "center",
                   border: "1px solid",
                   borderColor: error ? "#c02d2d" : "inherit",
                   p: 2
               }}>
            <Upload sx={{width: "3rem", height: "3rem"}}/>
            <InputBase type="file" sx={{display: "none"}} id={"uploader-" + name} onChange={handleUpload}/>
            <label htmlFor={"uploader-" + name}>
                <a style={{
                    cursor: "pointer",
                    padding: "1rem",
                    backgroundColor: "#1976d2",
                    borderRadius: "5px",
                    color: "white"
                }}>Add Files</a>
            </label>
            {helperText && <Typography color={error ? "error" : "inherit"}>{helperText}</Typography>}
            <List>
                {files.map((file, index) =>
                    <ListItem key={index}>
                        <ListItemAvatar>
                            <Avatar>
                                {index + 1}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={file.name} secondary={file.error && <Typography color={"#f20f0f"}>
                            {file.error}
                        </Typography>}/>
                        <ListItemSecondaryAction>
                            <IconButton href={file.url} target={"_blank"}>
                                <Download/>
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>)}
                {progress ? <ListItem>
                    <LinearProgress value={progress * 100}/>
                </ListItem> : null}
            </List>
        </Paper>
    </Box>
}

export default Uploader;
