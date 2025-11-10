# Multiple Patients Per Order - Implementation Guide

## Overview
This guide documents the implementation of multiple patients per order with patient-test assignment capabilities.

## Backend Changes (✅ COMPLETED)

### 1. Database Migrations

#### Created Tables:
- **`order_item_patient`** - Pivot table for many-to-many relationship between patients and order items
- **`patient_relations`** - Tracks relationships between patients
- **Updated `orders` table** - Added `main_patient_id` and `patient_ids` fields
- **Updated OrderStep enum** - Added `PATIENT_TEST_ASSIGNMENT` step

### 2. Model Updates

#### Patient Model
```php
// New relationships
- OrderItems() - Tests associated with this patient
- RelatedPatients() - Patients related to this one
- RelatedByPatients() - Inverse relationships
- AllRelations() - Get all relations in both directions
```

#### OrderItem Model
```php
// New relationships and methods
- Patients() - All patients for this test
- MainPatient() - The primary patient for this test
- AdditionalPatients() - Secondary patients for this test
```

#### Order Model
```php
// Updated relationships
- Patient() / MainPatient() - Uses main_patient_id
- Patients() - Get all patients in order from patient_ids
// New fields
- main_patient_id - Primary patient
- patient_ids (JSON) - Array of all patient IDs
```

### 3. Controller & Repository Updates

#### OrderController
- Added handling for `PATIENT_TEST_ASSIGNMENT` step
- Loads patients and order items with patient assignments

#### OrderRepository
- **PATIENT_DETAILS step** - Now handles multiple patients:
  - Accepts array of patients via `patients` key
  - First patient becomes main patient
  - Saves patient relations if provided
  - Updates `patient_ids` and `main_patient_id`

- **PATIENT_TEST_ASSIGNMENT step** - New step handler:
  - Accepts `assignments` array with test_id and patient_ids
  - Assigns patients to specific tests
  - First patient in each assignment is marked as main
  - Falls back to assigning all tests to main patient if no assignments provided

## Frontend Implementation (📝 TODO)

### Required Components

#### 1. Updated PatientDetails Component
**File**: `resources/js/Pages/Order/Edit/PatientDetails.jsx`

```jsx
import React, { useState } from "react";
import { Button, Box, Typography, IconButton } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import PatientDetailsForm from "../Components/PatientDetailsForm";
import EditLayout from "../EditLayout";

const PatientDetails = ({ auth, order, step, genders }) => {
    // State for multiple patients
    const [patients, setPatients] = useState([
        order.patient || {
            fullName: "",
            nationality: null,
            dateOfBirth: "",
            gender: "",
            consanguineousParents: "",
            contact: null,
            isFetus: false,
            reference_id: "",
            id_no: ""
        }
    ]);

    const { submit, errors, processing } = useSubmitForm(
        { patients, _method: "put" },
        route("orders.update", { order: order.id, step })
    );

    // Add new patient
    const handleAddPatient = () => {
        setPatients([...patients, {
            fullName: "",
            nationality: null,
            dateOfBirth: "",
            gender: "",
            consanguineousParents: "",
            contact: null,
            isFetus: false,
            reference_id: "",
            id_no: ""
        }]);
    };

    // Remove patient (except first one)
    const handleRemovePatient = (index) => {
        if (patients.length > 1) {
            setPatients(patients.filter((_, i) => i !== index));
        }
    };

    // Update patient data
    const handlePatientChange = (index, key, value) => {
        const updatedPatients = [...patients];
        updatedPatients[index] = {
            ...updatedPatients[index],
            [key]: value
        };
        setPatients(updatedPatients);
    };

    const handleSubmit = () => {
        submit();
    };

    return (
        <EditLayout
            step={step}
            auth={auth}
            id={order.id}
            onSubmit={handleSubmit}
            isSubmitting={processing}
        >
            <Box>
                {patients.map((patient, index) => (
                    <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                {index === 0 ? 'Main Patient' : `Additional Patient ${index}`}
                            </Typography>
                            {index > 0 && (
                                <IconButton onClick={() => handleRemovePatient(index)} color="error">
                                    <Delete />
                                </IconButton>
                            )}
                        </Box>

                        <PatientDetailsForm
                            data={patient}
                            onChange={(key, value) => handlePatientChange(index, key, value)}
                            errors={errors[`patients.${index}`] || {}}
                            genders={genders}
                        />
                    </Box>
                ))}

                <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddPatient}
                    fullWidth
                    sx={{ mt: 2 }}
                >
                    Add Another Patient
                </Button>
            </Box>
        </EditLayout>
    );
};

export default PatientDetails;
```

#### 2. New PatientTestAssignment Component
**File**: `resources/js/Pages/Order/Edit/PatientTestAssignment.jsx`

```jsx
import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Chip,
    Alert
} from "@mui/material";
import { useSubmitForm } from "@/Services/api";
import EditLayout from "../EditLayout";

const PatientTestAssignment = ({ auth, order, step, patients }) => {
    // Initialize assignments: each test assigned to main patient by default
    const [assignments, setAssignments] = useState(() => {
        return order.tests.map(test => ({
            test_id: test.id,
            test_name: test.name,
            patient_ids: [order.main_patient_id] // Default to main patient
        }));
    });

    const { submit, processing } = useSubmitForm(
        { assignments, _method: "put" },
        route("orders.update", { order: order.id, step })
    );

    // Toggle patient for a test
    const handleTogglePatient = (testIndex, patientId) => {
        const updatedAssignments = [...assignments];
        const assignment = updatedAssignments[testIndex];

        if (assignment.patient_ids.includes(patientId)) {
            // Remove patient (must keep at least one)
            if (assignment.patient_ids.length > 1) {
                assignment.patient_ids = assignment.patient_ids.filter(id => id !== patientId);
            }
        } else {
            // Add patient
            assignment.patient_ids.push(patientId);
        }

        setAssignments(updatedAssignments);
    };

    const handleSubmit = () => {
        submit();
    };

    return (
        <EditLayout
            step={step}
            auth={auth}
            id={order.id}
            onSubmit={handleSubmit}
            isSubmitting={processing}
        >
            <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                    Select which patient(s) each test is for. By default, all tests are assigned to the main patient.
                </Alert>

                {assignments.map((assignment, testIndex) => (
                    <Card key={assignment.test_id} sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                {assignment.test_name}
                            </Typography>

                            <FormGroup>
                                {patients.map((patient, patientIndex) => (
                                    <FormControlLabel
                                        key={patient.id}
                                        control={
                                            <Checkbox
                                                checked={assignment.patient_ids.includes(patient.id)}
                                                onChange={() => handleTogglePatient(testIndex, patient.id)}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {patient.fullName}
                                                {patientIndex === 0 && (
                                                    <Chip label="Main Patient" size="small" color="primary" />
                                                )}
                                            </Box>
                                        }
                                    />
                                ))}
                            </FormGroup>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </EditLayout>
    );
};

export default PatientTestAssignment;
```

#### 3. Patient Relations Selector Component (Optional Enhancement)
**File**: `resources/js/Components/PatientRelationSelector.jsx`

```jsx
import React from "react";
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Box,
    IconButton,
    Typography
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";

const RELATION_TYPES = [
    "Parent",
    "Child",
    "Sibling",
    "Spouse",
    "Grandparent",
    "Grandchild",
    "Uncle/Aunt",
    "Nephew/Niece",
    "Cousin",
    "Other"
];

const PatientRelationSelector = ({ patients, currentPatientIndex, relations, onChange }) => {
    // Filter out current patient from selection
    const availablePatients = patients.filter((_, idx) => idx !== currentPatientIndex);

    const handleAddRelation = () => {
        onChange([...relations, { related_patient_id: "", relation_type: "", notes: "" }]);
    };

    const handleRemoveRelation = (index) => {
        onChange(relations.filter((_, i) => i !== index));
    };

    const handleRelationChange = (index, key, value) => {
        const updated = [...relations];
        updated[index] = { ...updated[index], [key]: value };
        onChange(updated);
    };

    return (
        <Box>
            <Typography variant="subtitle2" gutterBottom>
                Patient Relations (Optional)
            </Typography>

            {relations.map((relation, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Related To</InputLabel>
                        <Select
                            value={relation.related_patient_id}
                            onChange={(e) => handleRelationChange(index, 'related_patient_id', e.target.value)}
                            label="Related To"
                        >
                            {availablePatients.map((patient, idx) => (
                                <MenuItem key={idx} value={patient.id || idx}>
                                    {patient.fullName || `Patient ${idx + 1}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                        <InputLabel>Relation Type</InputLabel>
                        <Select
                            value={relation.relation_type}
                            onChange={(e) => handleRelationChange(index, 'relation_type', e.target.value)}
                            label="Relation Type"
                        >
                            {RELATION_TYPES.map(type => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <IconButton onClick={() => handleRemoveRelation(index)} color="error">
                        <Delete />
                    </IconButton>
                </Box>
            ))}

            <Button
                variant="text"
                startIcon={<Add />}
                onClick={handleAddRelation}
                disabled={availablePatients.length === 0}
            >
                Add Relation
            </Button>
        </Box>
    );
};

export default PatientRelationSelector;
```

### Integration Steps

1. **Update PatientDetails.jsx** - Replace existing file with multiple patient support
2. **Create PatientTestAssignment.jsx** - New step component
3. **Update OrderStep enum mapping** - Ensure frontend recognizes new step
4. **Update validation** - Add validation for multiple patients and assignments
5. **Update EditLayout** - Ensure step navigation includes new step

### Data Flow

```
Step 1: Test Method (existing)
  ↓ Select tests
Step 2: Patient Details (UPDATED)
  ↓ Enter multiple patients with "Add More" button
  ↓ Optionally set patient relations
  ↓ Submit saves all patients to order.patient_ids
  ↓ First patient becomes order.main_patient_id
Step 3: Patient-Test Assignment (NEW)
  ↓ Show all tests
  ↓ For each test, show checkboxes for all patients
  ↓ Default: all tests assigned to main patient
  ↓ User can assign multiple patients to each test
  ↓ Submit saves to order_item_patient pivot table
Step 4: Clinical Details (existing)
Step 5: Sample Details (existing)
Step 6: Consent Form (existing)
Step 7: Finalize (existing)
```

### API Payload Examples

#### Patient Details Step
```json
{
    "patients": [
        {
            "fullName": "John Doe",
            "nationality": {"code": "US"},
            "dateOfBirth": "1990-01-01",
            "gender": "male",
            "consanguineousParents": "no",
            "reference_id": "REF001"
        },
        {
            "fullName": "Jane Doe",
            "nationality": {"code": "US"},
            "dateOfBirth": "1992-05-15",
            "gender": "female",
            "consanguineousParents": "no",
            "relations": [
                {
                    "related_patient_id": 1,
                    "relation_type": "Spouse",
                    "notes": ""
                }
            ]
        }
    ]
}
```

#### Patient-Test Assignment Step
```json
{
    "assignments": [
        {
            "test_id": 1,
            "patient_ids": [1, 2]  // Both patients for this test
        },
        {
            "test_id": 2,
            "patient_ids": [1]  // Only main patient for this test
        }
    ]
}
```

## Testing Checklist

- [ ] Create order with single patient (backward compatibility)
- [ ] Create order with multiple patients
- [ ] Add patient relations
- [ ] Assign different patients to different tests
- [ ] Assign multiple patients to single test
- [ ] Verify main patient designation
- [ ] Test removing patients (except main)
- [ ] Verify patient-test assignments save correctly
- [ ] Test order display with multiple patients
- [ ] Verify backward compatibility with existing orders

## Database Queries for Verification

```sql
-- Get all patients for an order
SELECT p.* FROM patients p
JOIN orders o ON JSON_CONTAINS(o.patient_ids, JSON_QUOTE(p.id))
WHERE o.id = ?;

-- Get all patients assigned to a specific test in an order
SELECT p.*, oip.is_main
FROM patients p
JOIN order_item_patient oip ON p.id = oip.patient_id
JOIN order_items oi ON oip.order_item_id = oi.id
WHERE oi.order_id = ? AND oi.test_id = ?;

-- Get patient relations
SELECT p1.fullName as patient, p2.fullName as related_patient, pr.relation_type
FROM patient_relations pr
JOIN patients p1 ON pr.patient_id = p1.id
JOIN patients p2 ON pr.related_patient_id = p2.id;
```

## Notes

- Main patient is always the first patient entered
- At least one patient must be assigned to each test
- Patient relations are bidirectional but stored once
- The system falls back to assigning all tests to main patient if no explicit assignments are made
- Existing orders remain compatible (single patient workflow)

## Status

- ✅ Backend: 100% Complete
- 📝 Frontend: Implementation guide provided
- ⏳ Testing: Pending frontend completion
