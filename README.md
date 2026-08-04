# GovGuide AI

GovGuide AI is a local Retrieval-Augmented Generation application that answers questions about Dutch allowances using curated official information from Dienst Toeslagen.

It combines n8n, Ollama, Supabase PostgreSQL, pgvector, and a browser-based chat interface to retrieve relevant source content and generate grounded answers.

## 🎥 Demo Video

[Watch the full project demo on Google Drive](https://drive.google.com/file/d/1p5v70ulnZIuUx_WdWryy7KwFfvoTHLiV/view?usp=sharing)

## Final Webpage Demo
### Initial Chat Interface
<img width="1102" height="740" alt="image" src="https://github.com/user-attachments/assets/c9ad118c-cc91-4500-a57f-332e22f9533b" />

### Grounded Answer with Official Source
<img width="1102" height="740" alt="image" src="https://github.com/user-attachments/assets/8e3ba036-0502-4562-93b5-1cb309561252" />

### Follow-up Question
<img width="1102" height="740" alt="image" src="https://github.com/user-attachments/assets/7f2da2cf-02f0-40b6-a7f7-99aaedbbdb23" />

## Features

- Grounded answers from official source documents
- Local embeddings and answer generation with Ollama
- Vector search with Supabase and pgvector
- Rule-based topic classification
- Browser-based chat interface
- Follow-up question support
- Official source links in responses
- Validation and structured error handling
- No external language-model API required

## Supported Topics

| Topic | Source ID | Description |
|---|---|---|
| `income_change` | `TOE-001` | Reporting income changes |
| `definitive_calculation` | `TOE-002` | Understanding definitive allowance calculations |
| `repayment` | `TOE-003` | Reasons an allowance may need to be repaid |
| `payment_arrangement` | `TOE-004` | Standard and personal payment arrangements |
| `objection` | `TOE-005` | Objecting to a definitive calculation |
| `review_request` | `TOE-006` | Requesting a review after the objection deadline |

## Tech Stack

- **n8n** — workflow orchestration
- **Ollama** — local embeddings and answer generation
- **Supabase PostgreSQL** — document and metadata storage
- **pgvector** — vector similarity search
- **Nginx** — local frontend proxy
- **HTML, CSS, JavaScript** — browser chat interface

## Architecture

```text
Official Markdown Sources
        │
        ▼
n8n Ingestion Workflow
        │
        ├── Parse metadata
        ├── Split documents into chunks
        ├── Generate embeddings with Ollama
        └── Store vectors in Supabase
        │
        ▼
Supabase PostgreSQL + pgvector
        │
        ▼
n8n Retrieval Workflow
        │
        ├── Validate question
        ├── Classify topic
        ├── Generate query embedding
        ├── Search matching source chunks
        ├── Build grounded context
        ├── Generate answer with Ollama
        └── Return answer and sources
        │
        ▼
Browser Chat Interface
```

## Ingestion Workflow

The ingestion workflow prepares the official source documents for retrieval by parsing metadata, splitting the content into chunks, generating embeddings with Ollama, and storing the vectors in Supabase PostgreSQL with pgvector.

The workflow performs these main steps:

```text
Load Official Markdown Sources
→ Parse Document Metadata
→ Split Documents into Chunks
→ Add Embedding Prefix
→ Generate Embeddings with Ollama
→ Store Chunks and Vectors in Supabase
```
The screenshot below shows the complete ingestion workflow implemented in n8n.
<img width="1413" height="536" alt="image" src="https://github.com/user-attachments/assets/4e39fcae-24c2-46da-aa75-d1d1f0873f3a" />

## Retrieval Workflow

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
The screenshot below shows the complete retrieval and response-generation workflow in n8n.
<img width="1141" height="321" alt="image" src="https://github.com/user-attachments/assets/c6a07009-ba72-441c-b33c-75bec4774ff7" />

The system uses two retrieval stages:

1. rule-based topic classification
2. topic-filtered vector similarity search

This helps reduce irrelevant cross-topic results.

## Conversation Memory

The frontend stores the latest conversation messages and sends them with each request.

This allows follow-up questions such as:

```text
Why do I have to repay part of my allowance?
```

followed by:

```text
What if I cannot pay it all at once?
```

The second question can switch from the `repayment` topic to `payment_arrangement`.

Conversation history is used only to understand context. Factual answers must still come from the retrieved official source documents.

Conversation memory resets when the page is refreshed.

## Model Configuration

### Embedding model

```text
nomic-embed-text-v2-moe
```

Configuration:

```text
Vector dimensions: 768
Document prefix: search_document
Query prefix: search_query
```

### Answer model

```text
qwen2.5:3b-instruct
```

Configuration:

```text
Temperature: 0.2
Context window: 4096
Maximum output tokens: 180
Streaming: false
Keep alive: 30 minutes
```

## API

### Endpoint

```text
POST /webhook/govguide-question
```

Local URL:

```text
http://localhost:5678/webhook/govguide-question
```

### Request

```json
{
  "question": "Why do I have to repay part of my allowance?"
}
```

### Successful response

```json
{
  "question": "Why do I have to repay part of my allowance?",
  "topic": "repayment",
  "answer": "You may need to repay part of your allowance because your situation changed or your final income was higher than the estimate used for the advance payment.",
  "sources": [
    {
      "source_id": "TOE-003",
      "source_title": "Waarom moet ik toeslag terugbetalen?",
      "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/nl/toeslag-terugbetalen/content/waarom-moet-ik-toeslag-terugbetalen"
    }
  ]
}
```

## Error Handling

| Situation | HTTP Status | Error Code |
|---|---:|---|
| Invalid question | 400 | Validation-specific code |
| No relevant results | 404 | `NO_RELEVANT_RESULTS` |
| Unsupported topic | 422 | `UNSUPPORTED_TOPIC` |
| Ollama failure | 503 | `ANSWER_GENERATION_FAILED` |

More details are available in:

```text
docs/error-handling.md
```

## Project Structure

```text
govguide-ai-rag/
├── docs/
│   ├── api.md
│   ├── workflow.md
│   └── error-handling.md
│
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── nginx.conf
│
├── sources/
│   ├── TOE-001.md
│   ├── TOE-002.md
│   ├── TOE-003.md
│   ├── TOE-004.md
│   ├── TOE-005.md
│   └── TOE-006.md
│
├── workflows/
│   ├── govguide-ingestion-workflow.json
│   └── govguide-retrieval-workflow.json
│
├── README.md
└── .gitignore
```

## Local Setup

### 1. Install or run

- Docker Desktop
- n8n
- Ollama
- Supabase project with pgvector

### 2. Pull the Ollama models

```bash
ollama pull nomic-embed-text-v2-moe
ollama pull qwen2.5:3b-instruct
```

### 3. Start n8n

```bash
docker start n8n
```

Open:

```text
http://localhost:5678
```

### 4. Import the workflows

Import:

```text
workflows/govguide-ingestion-workflow.json
workflows/govguide-retrieval-workflow.json
```

Reconnect the required n8n credentials after importing.

### 5. Run the ingestion workflow

Run the ingestion workflow to create document chunks and embeddings in Supabase.

### 6. Start the frontend

From the `frontend` folder:

```bash
docker run --rm \
  --name govguide-frontend \
  -p 8080:80 \
  -v "$PWD":/usr/share/nginx/html:ro \
  -v "$PWD/nginx.conf":/etc/nginx/conf.d/default.conf:ro \
  nginx:alpine
```

Open:

```text
http://localhost:8080
```

## Suggested Demo Questions

```text
My income has changed. Do I need to report it?
```

```text
What is a definitive allowance calculation?
```

```text
Why do I have to repay part of my allowance?
```

```text
What if I cannot pay it all at once?
```

```text
How can I object to my definitive calculation?
```

```text
What can I do if I missed the objection deadline?
```

## Security Notes

- do not commit Supabase service-role keys
- do not commit passwords or bearer tokens
- keep credentials inside n8n or environment variables
- do not request DigiD credentials
- do not store real personal tax data
- do not expose internal n8n error messages

## Current Limitations

- only six topics are supported
- the classifier is rule-based
- source coverage is limited
- conversation memory resets on refresh
- no user authentication is implemented
- no production deployment configuration is included
- responses may occasionally be less concise than intended

## Future Improvements

- add more official sources and topics
- add persistent conversation sessions
- add automated source refresh and verification
- add automated retrieval evaluation
- add multilingual answers
- add authentication and rate limiting
- deploy the frontend and workflows
- add monitoring and structured logs

## Documentation

Detailed documentation is available in:

- `docs/api.md`
- `docs/workflow.md`
- `docs/error-handling.md`

## Disclaimer

GovGuide AI is an educational portfolio project.

It is not an official Dienst Toeslagen or Belastingdienst service.

Users should verify important information using the linked official government sources.
