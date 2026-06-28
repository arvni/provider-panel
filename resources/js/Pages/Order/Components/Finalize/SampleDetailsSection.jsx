import React from "react";
import {
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useTheme,
    alpha,
} from "@mui/material";
import { ScienceOutlined } from "@mui/icons-material";
import CollapsibleSection from "@/Pages/Order/Components/Finalize/CollapsibleSection";
import EditSectionButton from "@/Pages/Order/Components/Finalize/EditSectionButton";
import { formatLongDate } from "@/Pages/Order/Components/orderDisplay";

/**
 * Sample-materials review section on the Finalize page.
 */
const SampleDetailsSection = ({ data, errors, expanded, onToggle, status, hasError, orderId }) => {
    const theme = useTheme();

    return (
        <CollapsibleSection
            icon={<ScienceOutlined />}
            title="Sample Materials"
            expanded={expanded}
            onToggle={onToggle}
            hasError={hasError}
            headerBg={alpha(theme.palette.success.main, 0.8)}
            headerColor={theme.palette.success.contrastText}
            status={status}
        >
            {errors.samples && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
                    {errors.samples}
                </Alert>
            )}

            {data.samples && data.samples.length > 0 ? (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Sample Type</TableCell>
                                <TableCell>Sample ID</TableCell>
                                <TableCell>Patient</TableCell>
                                <TableCell>Test</TableCell>
                                <TableCell>Collection Date</TableCell>
                                <TableCell>Expiration Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.samples?.map((sample, index) => (
                                <TableRow
                                    key={`sample-${index}`}
                                    sx={{
                                        bgcolor: Object.keys(errors).some(
                                            (key) =>
                                                key.startsWith(`samples[${index}]`) ||
                                                key.startsWith(`samples.${index}`)
                                        )
                                            ? alpha(theme.palette.error.main, 0.05)
                                            : "transparent",
                                    }}
                                >
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <Typography
                                            color={
                                                Object.keys(errors).some(
                                                    (key) =>
                                                        key.includes(
                                                            `samples[${index}].sample_type`
                                                        ) ||
                                                        key.includes(`samples.${index}.sample_type`)
                                                )
                                                    ? "error.main"
                                                    : "text.primary"
                                            }
                                        >
                                            {sample.sample_type?.name || "Not specified"}
                                        </Typography>
                                        {Object.keys(errors).some(
                                            (key) =>
                                                key.includes(`samples[${index}].sample_type`) ||
                                                key.includes(`samples.${index}.sample_type`)
                                        ) && (
                                            <Typography variant="caption" color="error">
                                                {errors[`samples[${index}].sample_type`] ||
                                                    errors[`samples.${index}.sample_type`]}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            color={
                                                Object.keys(errors).some(
                                                    (key) =>
                                                        key.includes(
                                                            `samples[${index}].sampleId`
                                                        ) ||
                                                        key.includes(`samples.${index}.sampleId`)
                                                )
                                                    ? "error.main"
                                                    : "text.primary"
                                            }
                                        >
                                            {sample.sampleId || "Not specified"}
                                        </Typography>
                                        {Object.keys(errors).some(
                                            (key) =>
                                                key.includes(`samples[${index}].sampleId`) ||
                                                key.includes(`samples.${index}.sampleId`)
                                        ) && (
                                            <Typography variant="caption" color="error">
                                                {errors[`samples[${index}].sampleId`] ||
                                                    errors[`samples.${index}.sampleId`]}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {sample.patient?.fullName ||
                                                sample.patient?.full_name ||
                                                "-"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {sample.order_item?.test?.name ||
                                                sample.order_item?.Test?.name ||
                                                "-"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            color={
                                                Object.keys(errors).some(
                                                    (key) =>
                                                        key.includes(
                                                            `samples[${index}].collectionDate`
                                                        ) ||
                                                        key.includes(
                                                            `samples.${index}.collectionDate`
                                                        )
                                                )
                                                    ? "error.main"
                                                    : "text.primary"
                                            }
                                        >
                                            {formatLongDate(sample.collectionDate)}
                                        </Typography>
                                        {Object.keys(errors).some(
                                            (key) =>
                                                key.includes(`samples[${index}].collectionDate`) ||
                                                key.includes(`samples.${index}.collectionDate`)
                                        ) && (
                                            <Typography variant="caption" color="error">
                                                {errors[`samples[${index}].collectionDate`] ||
                                                    errors[`samples.${index}.collectionDate`]}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {sample?.material
                                            ? formatLongDate(sample.material.expireDate)
                                            : "Not specified"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Alert severity="warning">
                    No samples have been added. Please add at least one sample.
                </Alert>
            )}

            <EditSectionButton orderId={orderId} step="sample details" label="Edit Samples" />
        </CollapsibleSection>
    );
};

export default SampleDetailsSection;
