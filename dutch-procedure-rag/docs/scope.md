# GovGuide AI

## Project Goal

Develop a production-inspired Retrieval-Augmented Generation (RAG) application that helps users navigate Dutch public-service procedures using **curated official Dutch public-service information**.

The application retrieves relevant information from trusted government sources using semantic search and metadata filtering, then generates evidence-backed responses with source citations and clear explanations.

This project is designed to demonstrate practical AI engineering concepts including Retrieval-Augmented Generation (RAG), vector databases, embeddings, workflow orchestration, and responsible AI.

---

# Problem Statement

Dutch public-service information is often distributed across multiple websites and documents. Users frequently need to search several sources before understanding which procedures apply to their situation, what actions are required, and where to find the relevant official guidance.

Traditional search engines return lists of webpages, while translation tools only translate content. Neither provides personalised, evidence-based guidance that combines information from multiple official sources.

GovGuide AI addresses this challenge by retrieving relevant information from curated official sources and generating structured, source-backed responses.

---

# Initial Scope (MVP)

## Initial Domain

The first version of GovGuide AI focuses on changes and repayments involving Dutch allowances, known as toeslagen.

The application helps users identify the appropriate procedural next step when:

- their income or personal situation changes
- their allowance amount appears incorrect
- they receive a definitive calculation
- they are asked to repay an allowance
- they disagree with a decision
- they cannot repay the amount in one payment

The system does not calculate allowance entitlement or provide personalised tax or legal advice. It retrieves and organises relevant procedural guidance from curated official Dienst Toeslagen sources.

## Primary User Scenario

A user receives zorgtoeslag and later starts earning more. They receive a definitive calculation requiring repayment and want to understand:

- why repayment may have occurred
- whether their income should be updated
- whether they should report a change or file an objection
- which deadlines may apply
- what repayment arrangements may be available
---

# AI Engineering Concepts Demonstrated

* Retrieval-Augmented Generation (RAG)
* Vector embeddings
* Semantic search
* Metadata filtering
* Hybrid retrieval (future enhancement)
* Prompt engineering
* Source-grounded responses
* Retrieval evaluation
* Workflow orchestration using n8n
* PostgreSQL with pgvector
* Responsible AI principles

---

# Technology Stack

* n8n
* Supabase
* PostgreSQL
* pgvector
* OpenAI API
* Git
* GitHub

---

# Success Criteria

The MVP will successfully:

* Retrieve relevant information from curated official government sources.
* Generate accurate, evidence-backed responses.
* Cite retrieved source documents.
* Demonstrate semantic vector search.
* Demonstrate metadata filtering.
* Handle situations where no reliable evidence is available.
* Showcase an end-to-end RAG workflow suitable for an AI engineering portfolio.

---

# Out of Scope

The MVP will **not** include:

* Legal, immigration, or financial advice.
* DigiD integration.
* Access to personal government records.
* Automatic application submission.
* Storage of sensitive personal information.
* Full coverage of all Dutch public-service organisations.

---

# Long-Term Vision

GovGuide AI is designed as a modular AI platform that can support multiple Dutch public-service organisations by adding new curated knowledge bases and retrieval workflows.

The architecture is intended to be reusable across different domains while maintaining transparency, traceability, explainability, and evidence-based AI responses.
