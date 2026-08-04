# GovGuide AI Workflow

## Overview

GovGuide AI is a local Retrieval-Augmented Generation application built with:

- n8n
- Ollama
- Supabase PostgreSQL
- pgvector
- curated official source documents

The system retrieves relevant official information before generating an answer.

The language model is instructed to answer only from the retrieved context.

## Main Retrieval Workflow

The main workflow processes a question through the following stages.

```text
Webhook
→ Normalize Webhook Question
→ Validate Question
→ Is Question Valid?
→ Classify Topic
→ Is Topic Known?
→ Generate Query Embedding — Ollama
→ Search Supabase Vector DB
→ Were Results Found?
→ Build Answer Context
→ Generate Final Answer — Ollama
→ Did Ollama Return an Answer?
→ Format Final Response
→ Respond to Webhook
```

## Step 1: Receive the Question

The `Webhook` node receives an HTTP POST request.

Expected request:

```json
{
  "question": "Why do I have to repay part of my allowance?"
}
```

## Step 2: Normalize the Question

The `Normalize Webhook Question` node extracts and normalizes the question from the incoming webhook body.

Its purpose is to create a consistent field:

```json
{
  "question": "Why do I have to repay part of my allowance?"
}
```

## Step 3: Validate the Question

The `Validate Question` node checks whether the question is usable.

It validates that the question:

- exists
- is a string
- is not empty
- contains at least 5 characters
- contains no more than 1000 characters

The node returns a Boolean field:

```json
{
  "valid": true
}
```

or:

```json
{
  "valid": false,
  "status_code": 400,
  "error_code": "EMPTY_QUESTION",
  "error": "The question cannot be empty."
}
```

## Step 4: Route Invalid Questions

The `Is Question Valid?` IF node routes the request.

```text
true  → Classify Topic
false → Respond Validation Error
```

Invalid requests return HTTP status `400`.

## Step 5: Classify the Topic

The `Classify Topic` node uses rule-based JavaScript logic to assign one of the supported topics.

Supported topics:

```text
income_change
definitive_calculation
repayment
payment_arrangement
objection
review_request
```

Example result:

```json
{
  "question": "Can I arrange monthly repayments?",
  "topic": "payment_arrangement"
}
```

The classifier checks `payment_arrangement` before `repayment` so that questions about payment plans are not incorrectly classified as general repayment questions.

## Step 6: Route Unsupported Topics

The `Is Topic Known?` IF node checks whether the classifier returned a valid topic.

```text
true  → Generate Query Embedding — Ollama
false → Respond Unknown Topic
```

Unsupported questions return HTTP status `422`.

## Step 7: Generate the Query Embedding

The `Generate Query Embedding — Ollama` node converts the question into a numerical vector.

Embedding configuration:

```text
Model: nomic-embed-text-v2-moe
Vector dimensions: 768
Query prefix: search_query
```

The query prefix helps the embedding model understand that the text represents a search query.

## Step 8: Search Supabase

The `Search Supabase Vector DB` node calls the Supabase vector-search function.

The search uses:

- the generated query embedding
- the classified topic
- a configurable similarity threshold
- a maximum of 2 retrieved results

The topic filter limits the search to documents belonging to the selected topic.

This reduces irrelevant cross-topic matches.

## Step 9: Check Whether Results Were Found

The `Were Results Found?` IF node checks whether Supabase returned at least one result containing a `source_id`.

```text
true  → Build Answer Context
false → Respond No Results
```

No relevant results return HTTP status `404`.

## Step 10: Build the Answer Context

The `Build Answer Context` node combines the retrieved source chunks into a prompt-ready context.

The context includes fields such as:

```text
source_id
source_title
source_url
document content
similarity score
```

The node also preserves:

```text
question
topic
sources
```

## Step 11: Generate the Final Answer

The `Generate Final Answer — Ollama` node sends the question and retrieved context to the local language model.

Configuration:

```text
Model: qwen2.5:3b-instruct
Temperature: 0.2
Context window: 4096
Maximum output tokens: 180
Streaming: false
Keep alive: 30 minutes
```

The prompt instructs the model to:

- answer only from the retrieved context
- avoid unsupported claims
- provide a concise answer
- avoid exposing internal reasoning
- avoid inventing sources
- state uncertainty when the context is insufficient

## Step 12: Check the Ollama Response

The `Did Ollama Return an Answer?` IF node checks whether the model returned a non-empty string in:

```text
message.content
```

Routing:

```text
true  → Format Final Response
false → Respond Ollama Error
```

An empty response or Ollama failure returns HTTP status `503`.

## Step 13: Format the Final Response

The `Format Final Response` node creates the public API response.

It:

- extracts the generated answer
- removes unwanted reasoning text
- deduplicates sources
- returns structured JSON

Example:

```json
{
  "question": "Why do I have to repay part of my allowance?",
  "topic": "repayment",
  "answer": "You may need to repay allowance because your situation changed or your final income was higher than the estimate used for the advance payment.",
  "sources": [
    {
      "source_id": "TOE-003",
      "source_title": "Waarom moet ik toeslag terugbetalen?",
      "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/nl/toeslag-terugbetalen/content/waarom-moet-ik-toeslag-terugbetalen"
    }
  ]
}
```

## Step 14: Respond to the Webhook

The `Respond to Webhook` node sends the final JSON response to the client with HTTP status `200`.

## Error Branches

The workflow contains four controlled error branches.

```text
Invalid input
→ Respond Validation Error
→ HTTP 400

Unsupported topic
→ Respond Unknown Topic
→ HTTP 422

No vector results
→ Respond No Results
→ HTTP 404

Ollama failure or empty answer
→ Respond Ollama Error
→ HTTP 503
```

## Manual Testing Path

The workflow also contains a manual testing path.

```text
Manual Trigger
→ Test Question
→ Classify Topic
→ Retrieval and answer workflow
```

The `Evaluate Result` node is used only during manual evaluation.

It is not connected to the production webhook response because it references the `Test Question` node, which is not present in webhook executions.

## Ingestion Workflow

The separate ingestion workflow prepares the source documents.

Its main stages are:

```text
Read curated Markdown documents
→ Extract text
→ Parse YAML metadata
→ Split documents into chunks
→ Generate document embeddings with Ollama
→ Store chunks and vectors in Supabase
```

Document embedding configuration:

```text
Model: nomic-embed-text-v2-moe
Vector dimensions: 768
Document prefix: search_document
```

## Retrieval Strategy

GovGuide AI uses a two-stage retrieval strategy:

1. rule-based topic classification
2. topic-filtered vector similarity search

This approach is more reliable than performing an unrestricted vector search across every document.

The classifier first narrows the domain, and vector search then finds the most relevant chunks inside that domain.

## Privacy and Local Processing

User questions and answer generation are processed locally through Ollama.

Supabase is used for storing and retrieving document chunks, metadata, and vector embeddings.

The system does not send user questions to an external language-model provider.

## Current Source Coverage

The current version uses six curated official sources from Dienst Toeslagen:

```text
TOE-001 → income_change
TOE-002 → definitive_calculation
TOE-003 → repayment
TOE-004 → payment_arrangement
TOE-005 → objection
TOE-006 → review_request
```

Each source record contains:

```text
source_id
organisation
topic
language
status
retrieved_at
last_verified
source_title
source_url
document content
embedding vector
```

All current source documents were retrieved and verified on:

```text
2026-08-03
```