# GovGuide AI Error Handling

## Overview

GovGuide AI uses controlled error branches so that workflow failures return structured API responses instead of exposing internal n8n errors.

Each error response contains:

```text
success
error_code
error
```

Some responses also contain:

```text
question
topic
```

## 1. Invalid Question

### HTTP Status

```text
400 Bad Request
```

### Trigger Conditions

This error is returned when:

- the `question` field is missing
- the question is not a string
- the question is empty
- the question contains fewer than 5 characters
- the question exceeds 1000 characters

### Example Empty Question Response

```json
{
  "success": false,
  "error_code": "EMPTY_QUESTION",
  "error": "The question cannot be empty."
}
```

### Example Missing Question Request

```json
{}
```

### Example Empty Question Request

```json
{
  "question": ""
}
```

### Workflow Route

```text
Validate Question
→ Is Question Valid?
→ false
→ Respond Validation Error
```

## 2. Unsupported Topic

### HTTP Status

```text
422 Unprocessable Entity
```

### Trigger Condition

This error is returned when the rule-based classifier cannot map the question to a supported topic.

Example unsupported question:

```json
{
  "question": "What will the weather be tomorrow?"
}
```

### Example Response

```json
{
  "success": false,
  "error_code": "UNSUPPORTED_TOPIC",
  "error": "I can currently answer questions about income changes, definitive calculations, repayments, payment arrangements, objections, and review requests.",
  "question": "What will the weather be tomorrow?"
}
```

### Workflow Route

```text
Classify Topic
→ Is Topic Known?
→ false
→ Respond Unknown Topic
```

## 3. No Relevant Search Results

### HTTP Status

```text
404 Not Found
```

### Trigger Condition

This error is returned when the Supabase vector search does not return a relevant source result.

The `Were Results Found?` node checks whether the search output contains a valid `source_id`.

### Example Response

```json
{
  "success": false,
  "error_code": "NO_RELEVANT_RESULTS",
  "error": "I could not find enough relevant information in the official sources to answer this question.",
  "question": "Why do I have to repay part of my allowance?",
  "topic": "repayment"
}
```

### Workflow Route

```text
Search Supabase Vector DB
→ Were Results Found?
→ false
→ Respond No Results
```

### Testing Method

This branch was tested by temporarily setting the vector-search threshold to:

```text
0.99
```

This intentionally prevented results below the test threshold from being returned.

After testing, the threshold was restored to its normal value and the workflow was published again.

## 4. Answer Generation Failure

### HTTP Status

```text
503 Service Unavailable
```

### Trigger Conditions

This error is returned when:

- Ollama is unavailable
- the Ollama request fails
- the configured model does not exist
- the model returns no response
- `message.content` is missing
- `message.content` is empty

### Example Response

```json
{
  "success": false,
  "error_code": "ANSWER_GENERATION_FAILED",
  "error": "The answer service is temporarily unavailable. Please try again.",
  "question": "Why do I have to repay part of my allowance?",
  "topic": "repayment"
}
```

### Workflow Route

```text
Generate Final Answer — Ollama
→ Did Ollama Return an Answer?
→ false
→ Respond Ollama Error
```

### Node Configuration

The `Generate Final Answer — Ollama` node uses:

```text
On Error: Continue (using regular output)
```

This allows the workflow to inspect the failed or empty result instead of immediately stopping.

### Testing Method

This branch was tested by temporarily changing the model name to an invalid model:

```text
qwen2.5:missing-model
```

The expected result was HTTP status `503`.

After testing, the model was restored to:

```text
qwen2.5:3b-instruct
```

The workflow was then published again.

## Standard Error Format

Controlled errors use the following general structure:

```json
{
  "success": false,
  "error_code": "ERROR_CODE",
  "error": "Human-readable explanation"
}
```

Where available, the response also includes:

```json
{
  "question": "The original question",
  "topic": "classified_topic"
}
```

## Error Summary

| Situation | HTTP Status | Error Code |
|---|---:|---|
| Invalid question | 400 | Validation-specific code |
| No relevant vector results | 404 | `NO_RELEVANT_RESULTS` |
| Unsupported topic | 422 | `UNSUPPORTED_TOPIC` |
| Ollama or answer failure | 503 | `ANSWER_GENERATION_FAILED` |

## Security Notes

- Supabase secret keys must not be committed to Git.
- Credentials should remain inside n8n credentials or protected environment variables.
- Ollama runs locally.
- Real DigiD credentials must never be requested.
- Personal tax records must not be stored in the demo system.
- The system provides procedural guidance, not legal or financial advice.
- Internal n8n error details should not be returned to API users.
- Public responses should contain safe, human-readable error messages only.