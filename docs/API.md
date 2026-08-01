# API.md

The single source of truth for frontend/backend communication. Base path: `/api`. No authentication (MVP has no accounts).

---

## `POST /api/questionnaire`

**Purpose:** Turn a free-text business idea into a tailored questionnaire.

**Request Body:**
```json
{ "businessIdea": "string" }
```

**Response Body (201):**
```json
{
  "planId": "uuid",
  "questions": [
    { "id": "string", "label": "string", "type": "boolean | text" }
  ]
}
```

**Status Codes:** `201` created · `400` invalid input · `429` rate limited · `500` upstream AI failure

**Validation Rules:** `businessIdea` required, 10–500 characters.

---

## `POST /api/business-plans`

**Purpose:** Submit questionnaire answers and start plan generation.

**Request Body:**
```json
{ "planId": "uuid", "answers": { "questionId": "boolean | string" } }
```

**Response Body (202):**
```json
{ "planId": "uuid", "status": "processing" }
```

**Status Codes:** `202` accepted · `400` missing/invalid answers · `404` plan not found · `409` already processed · `429` rate limited

**Validation Rules:** `planId` required, must reference an existing plan with status `awaiting_answers`. `answers` required, must cover every question id from the questionnaire.

---

## `GET /api/business-plans/:id`

**Purpose:** Poll status; once complete, fetch the generated plan. One endpoint for both.

**Request Body:** none

**Response Body (200), while processing:**
```json
{ "status": "processing" }
```

**Response Body (200), once complete:**
```json
{
  "status": "completed",
  "content": {
    "executiveSummary": "string",
    "businessDescription": "string",
    "marketAnalysis": "string",
    "marketingStrategy": "string",
    "operationsPlan": "string",
    "financialPlan": "string",
    "startupCostEstimate": "string",
    "operatingCostEstimate": "string",
    "breakEvenEstimate": "string",
    "cashFlowProjection": "string",
    "regulatoryConsiderations": "string",
    "risks": "string",
    "recommendations": "string"
  }
}
```
Or, on failure: `{ "status": "failed", "error": "string" }`

**Status Codes:** `200` ok (any status value) · `404` unknown plan id

**Validation Rules:** `:id` must be a valid UUID.

---

## `GET /api/business-plans/:id/export/pdf`

**Purpose:** Render and stream the plan as PDF, generated on demand.

**Request Body:** none

**Response Body:** binary stream, `Content-Type: application/pdf`

**Status Codes:** `200` ok · `404` unknown plan id · `409` plan not completed · `500` rendering failure

**Validation Rules:** `:id` must be a valid UUID referencing a plan with status `completed`.

---

## `GET /api/business-plans/:id/export/docx`

**Purpose:** Render and stream the plan as an editable Word document, generated on demand.

**Request Body:** none

**Response Body:** binary stream, `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Status Codes:** `200` ok · `404` unknown plan id · `409` plan not completed · `500` rendering failure

**Validation Rules:** `:id` must be a valid UUID referencing a plan with status `completed`.