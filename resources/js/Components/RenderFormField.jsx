import React from "react";
import FormField from "@/Components/FormField";

/**
 * RenderFormField - Adapter component to convert dynamic form data to FormField
 * This component serves as a bridge between the legacy form structure and the enhanced FormField
 *
 * @param {Object} props
 * @param {Object} props.field - The field configuration from orderForms
 * @param {Function} props.onchange - Change handler from parent
 * @param {any} props.defaultValue - Default value for the field
 * @param {Object} props.errors - Error messages object
 * @returns {JSX.Element}
 */
const RenderFormField = ({ field, onchange, defaultValue = null, errors = {},size="medium" }) => {
    // Generate the error path for this field
    const getErrorPath = () => {
        // This assumes the error path follows the structure: orderForms[formIndex].formData[fieldIndex].value
        const formIndex = field.formIndex;
        const fieldIndex = field.fieldIndex;

        if (formIndex !== undefined && fieldIndex !== undefined) {
            return `orderForms[${formIndex}].formData[${fieldIndex}].value`;
        }

        return field.name;
    };

    // Convert field to FormField format
    const getFormattedField = () => {
        // Base field configuration
        const formattedField = {
            type: field.type || "text",
            name: field.name || field.id,
            label: field.label || "",
            value: defaultValue,
            required: field.required || false,
            disabled: field.disabled || false,
            placeholder: field.placeholder || "",
            helpText: field.description,
        };

        // Add field-specific properties
        switch (field.type) {
            case "select":
            case "radio":
                // Format options for select/radio fields
                formattedField.options = field.options ?
                    field.options.map(opt =>
                        typeof opt === "object" ? opt : { value: opt, label: opt }
                    ) : [];
                formattedField.row = field.layout === "row";
                break;

            case "number":
                formattedField.min = field.min;
                formattedField.max = field.max;
                formattedField.step = field.step || 1;
                break;

            case "date":
                formattedField.min = field.min;
                formattedField.max = field.max;
                break;

            case "textarea":
                formattedField.rows = field.rows || 4;
                break;
        }

        return formattedField;
    };

    // Format the change handler to match the expected format
    const handleChange = (e, checked) => {
        // Handle checkbox and switch separately
        if (field.type === "checkbox" || field.type === "switch") {
            onchange(e, checked);
            return;
        }

        // For select fields, handle the standard MUI select format
        if (field.type === "select") {
            onchange(e);
            return;
        }

        // For standard inputs, pass the event directly
        onchange(e);
    };

    // Generate the formatted field
    const formattedField = getFormattedField();

    // Generate the correct error path
    const errorPath = getErrorPath();

    return (
        <FormField
            field={formattedField}
            onchange={handleChange}
            errors={errors}
            errorPath={errorPath}
            size={size}
        />
    );
};

export default RenderFormField;
