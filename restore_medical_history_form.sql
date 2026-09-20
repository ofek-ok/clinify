-- Restore script for Medical History Intake Form in OP OS Core v1
INSERT INTO forms (title, description, is_public, fields) VALUES
(
  'Medical History Intake',
  'Please fill out your basic medical history before your first appointment.',
  true,
  '[
    {"id": "f1", "type": "text", "label": "Full Name", "required": true},
    {"id": "f2", "type": "tel", "label": "Phone Number", "required": true},
    {"id": "f3", "type": "textarea", "label": "Current Medications", "required": false},
    {"id": "f4", "type": "dropdown", "label": "Blood Type", "required": false, "options": ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]},
    {"id": "f5", "type": "checkbox", "label": "Do you smoke?", "required": false}
  ]'::jsonb
);
