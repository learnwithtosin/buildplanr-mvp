# API.md

The single source of truth for frontend/backend communication. Base path: `/api`. No authentication (MVP has no accounts).

---

## `POST /api/questionnaire`

**Purpose:** Turn a free-text business idea into the first page of a tailored questionnaire. Only the fixed page 1 is returned here — pages 2 and 3 are generated one at a time via `POST /api/business-plans/:id/next-page`, once each prior page's answers are known, so every AI-generated question is grounded in what the founder has actually said so far.

**Request Body:**
```json
{ "businessIdea": "string" }
```

**Response Body (201):**
```json
{
  "planId": "uuid",
  "page": {
    "page": 1,
    "title": "string",
    "questions": [
      {
        "id": "string",
        "label": "string",
        "type": "boolean | text | select",
        "options": [{ "value": "string", "label": "string" }]
      }
    ]
  }
}
```
`options` is present only when a question's `type` is `"select"`.

**Status Codes:** `201` created · `400` invalid input · `429` rate limited · `500` upstream AI failure

**Validation Rules:** `businessIdea` required, 10–500 characters.

---

## `POST /api/business-plans/:id/next-page`

**Purpose:** Submit the answers for whichever questionnaire page is currently pending, and get back the next AI-generated page — grounded in the business idea plus every answer given so far. Called between pages instead of generating the whole questionnaire upfront.

**Request Body:**
```json
{ "answers": { "questionId": "boolean | string" } }
```
`answers` covers only the question ids of the page the founder just completed, not the full questionnaire.

**Response Body (200):**
```json
{
  "page": {
    "page": 2,
    "title": "string",
    "questions": [
      {
        "id": "string",
        "label": "string",
        "type": "boolean | text | select",
        "options": [{ "value": "string", "label": "string" }]
      }
    ]
  },
  "isLastPage": false
}
```
Once `isLastPage` is `true` (page 3), the founder should submit via `POST /api/business-plans` next, not call this endpoint again.

**Status Codes:** `200` ok · `400` missing/invalid answers for the pending page · `404` plan not found · `409` plan already fully answered or already processed · `429` rate limited · `500` upstream AI failure

**Validation Rules:** `:id` must be a valid UUID referencing a plan with status `awaiting_answers`. `answers` required, must cover exactly the question ids of the currently-pending page — which page that is is derived from the plan's stored progress, not specified by the client.

---

## `POST /api/business-plans/:id/name-suggestions`

**Purpose:** Generate 3 candidate business names grounded in the plan's stored idea plus whatever `industryCategory`/`region` have been picked so far. Callable mid-page-1, before the rest of the questionnaire is submitted.

**Request Body:**
```json
{ "industryCategory": "string", "region": "string" }
```
Both fields are optional — the frontend may call this before the founder has answered them.

**Response Body (200):**
```json
{ "suggestions": ["string", "string", "string"] }
```

**Status Codes:** `200` ok · `400` invalid input · `404` plan not found · `429` rate limited · `500` upstream AI failure

**Validation Rules:** `:id` must be a valid UUID. `industryCategory` and `region`, if present, must be non-empty strings.

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