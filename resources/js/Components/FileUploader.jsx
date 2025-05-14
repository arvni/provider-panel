import React, { useState } from 'react';
import {
    Box,
    Button,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    Typography,
    alpha,
    useTheme
} from "@mui/material";
import {
    Delete,
    UploadFile,
    InsertDriveFile,
    PictureAsPdf,
    Image,
    VideoFile,
    AudioFile,
    Description
} from "@mui/icons-material";
import { styled } from '@mui/material/styles';

// Styled component for the drop zone
const DropZone = styled(Paper)(({ theme, isDragActive }) => ({
    padding: theme.spacing(3),
    border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
    backgroundColor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : theme.palette.background.paper,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.05)
    }
}));

// Function to get the appropriate icon based on file type
const getFileIcon = (fileName) => {
    if (!fileName) return <InsertDriveFile />;

    const extension = fileName.split('.').pop().toLowerCase();

    switch (extension) {
        case 'pdf':
            return <PictureAsPdf color="error" />;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp':
            return <Image color="primary" />;
        case 'mp4':
        case 'mov':
        case 'avi':
        case 'webm':
            return <VideoFile color="secondary" />;
        case 'mp3':
        case 'wav':
        case 'ogg':
            return <AudioFile color="success" />;
        default:
            return <Description />;
    }
};

// Format file size
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUploader = ({ title, description, onChange, name, defaultValues = [], maxFiles = 10 }) => {
    const theme = useTheme();
    const [isDragActive, setIsDragActive] = useState(false);
    const inputRef = React.useRef(null);

    const handleClick = () => {
        inputRef.current.click();
    };

    const handleChange = (e) => {
        const newFiles = Array.from(e.target.files);
        if (defaultValues.length + newFiles.length > maxFiles) {
            alert(`You can only upload a maximum of ${maxFiles} files.`);
            return;
        }
        onChange(name, [...defaultValues, ...newFiles]);
        // Clear the input value so the same file can be uploaded again if needed
        e.target.value = '';
    };

    const handleDelete = (index) => () => {
        const tmp = [...defaultValues];
        tmp.splice(index, 1);
        onChange(name, tmp);
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const newFiles = Array.from(e.dataTransfer.files);
        if (defaultValues.length + newFiles.length > maxFiles) {
            alert(`You can only upload a maximum of ${maxFiles} files.`);
            return;
        }
        onChange(name, [...defaultValues, ...newFiles]);
    };

    const getFileName = (file) => {
        if (typeof file === "string") {
            return file.split('/').pop();
        }
        return file.name;
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                {title}
            </Typography>

            {description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {description}
                </Typography>
            )}

            <DropZone
                variant="outlined"
                isDragActive={isDragActive}
                onClick={handleClick}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleChange}
                    accept="*/*"
                />

                <Stack direction="column" spacing={2} alignItems="center">
                    <Box
                        sx={{
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            borderRadius: '50%',
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <UploadFile
                            fontSize="large"
                            color="primary"
                        />
                    </Box>

                    <Typography variant="body1" fontWeight="medium">
                        Drag files here or click to upload
                    </Typography>

                    <Button
                        variant="contained"
                        color="primary"
                        disableElevation
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClick();
                        }}
                    >
                        Choose Files
                    </Button>

                    <Typography variant="caption" color="text.secondary">
                        Maximum {maxFiles} files
                    </Typography>

                    {defaultValues.length > 0 && (
                        <Chip
                            label={`${defaultValues.length} file${defaultValues.length > 1 ? 's' : ''} selected`}
                            color="primary"
                            variant="outlined"
                            size="small"
                        />
                    )}
                </Stack>
            </DropZone>

            {defaultValues.length > 0 && (
                <Paper variant="outlined" sx={{ mt: 2, p: 0, overflow: 'hidden' }}>
                    <List dense disablePadding>
                        {defaultValues.map((item, index) => {
                            const fileName = getFileName(item);
                            const fileSize = typeof item !== "string" ? formatFileSize(item.size) : '';
                            const fileUrl = typeof item === "string" ? `/files/${item}` : URL.createObjectURL(item);

                            return (
                                <ListItem
                                    key={`file-${index}`}
                                    divider={index !== defaultValues.length - 1}
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                        }
                                    }}
                                    secondaryAction={
                                        <Button
                                            size="small"
                                            color="error"
                                            variant="text"
                                            startIcon={<Delete />}
                                            onClick={handleDelete(index)}
                                        >
                                            Remove
                                        </Button>
                                    }
                                >
                                    <ListItemIcon>
                                        {getFileIcon(fileName)}
                                    </ListItemIcon>

                                    <ListItemText
                                        primary={
                                            <Typography
                                                variant="body2"
                                                component="span"
                                                sx={{
                                                    display: 'inline-block',
                                                    maxWidth: '70%',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                {fileName}
                                            </Typography>
                                        }
                                        secondary={
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {fileSize && <Typography variant="caption" color="text.secondary">{fileSize}</Typography>}
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        textDecoration: 'none',
                                                        color: theme.palette.primary.main,
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    Preview
                                                </a>
                                            </Stack>
                                        }
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default FileUploader;
