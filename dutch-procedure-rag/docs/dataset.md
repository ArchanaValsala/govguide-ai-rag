# GovGuide AI Dataset

## Domain

Dutch allowances (`toeslagen`) — income changes, definitive calculations, repayments, payment arrangements, objections, and review requests.

## Organisation

Dienst Toeslagen.

## Knowledge Base Scope

The knowledge base contains six curated official sources:

- TOE-001 — income changes
- TOE-002 — definitive calculations
- TOE-003 — reasons for repayment
- TOE-004 — payment arrangements
- TOE-005 — objections
- TOE-006 — review requests after the objection deadline

## Source Selection Method

Only official Dienst Toeslagen and Belastingdienst webpages were used.

Each source was selected because it represents a distinct procedural route that a user may need to understand.

General navigation pages and duplicate content were excluded because they do not contain enough standalone information for reliable retrieval.

## Content Preparation

The source content was manually curated from official webpages.

The following content was removed:

- navigation menus
- cookie notices
- footer links
- unrelated links
- duplicate sections
- promotional or non-procedural content

The original Dutch language was retained to demonstrate cross-language retrieval from English questions to Dutch source content.

## Metadata

Each source includes:

- source ID
- organisation
- topic
- source title
- source URL
- language
- status
- retrieval date
- last verification date

## Evaluation Dataset

The evaluation dataset contains 15 English user questions.

Each question is mapped to:

- the expected topic
- the expected source
- the expected procedural route
- notes describing the expected retrieval behaviour

The dataset includes:

- direct factual questions
- procedural routing questions
- repayment versus objection distinctions
- deadline questions
- a clarification case where the system should not guess

## Why RAG Is Appropriate

The correct response depends on retrieving the relevant procedural guidance.

For example:

- an income change may require reporting updated information
- disagreement with a definitive calculation may require an objection
- inability to pay may require a payment arrangement
- missing the objection deadline may require a review request

A language model answering from memory could confuse these routes. RAG grounds the answer in curated official evidence.

## Project Boundary

GovGuide AI provides procedural guidance only.

It does not:

- calculate allowance entitlement
- decide whether an official calculation is correct
- provide personalised tax or legal advice
- submit objections or review requests
- access Mijn Toeslagen
- request or store DigiD credentials
- process real sensitive personal data