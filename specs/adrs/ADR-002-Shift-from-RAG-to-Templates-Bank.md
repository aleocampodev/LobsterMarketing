# ADR 002: Shift from RAG to Templates Bank for Content Generation
Version: v1.0

## 1. Context and Problem

Originally, the Nenufar Marketing Automation System was designed to use a Retrieval-Augmented Generation (RAG) approach. In that architecture, the AI agent (Luna) would dynamically query a vector database for brand guidelines, catalogs, and technical details to generate social media captions from scratch for every post.

However, as the system evolved, two main issues became apparent:
1. **Token Consumption (Cost & Latency):** Passing extensive brand guidelines and catalogs as context to the LLM (Gemini 2.5 Flash) for every single execution consumes a high volume of input tokens, increasing both latency and potential costs.
2. **Brand Consistency:** While LLMs are creative, pure dynamic generation can occasionally deviate from the specific "Eco Poético" tone or forget crucial social impact narratives (like mentioning the artisan mothers) despite prompt engineering.

## 2. Considered Options

1. **Keep Pure RAG:** Maintain a pgvector database and retrieve context dynamically.
2. **Few-Shot Prompting:** Hardcode 3-5 examples into the system prompt, increasing the base token count permanently.
3. **Templates Bank (Interpolation + Light LLM Touch):** Create a database of predefined, brand-approved copy structures where variables (`{{product_name}}`, `{{artisan_name}}`) are interpolated mechanically. The LLM is only used (optionally) for minor grammatical adjustments or conversational wrapping.

## 3. Decision

We decided to implement **Option 3 (Templates Bank)**. The system now centralizes copy structures in `specs/templates_bank.md` (and a corresponding Supabase table) instead of generating dynamic text via RAG.

## 4. Justification

*   **Drastic Token Reduction:** By interpolating variables directly into pre-written text, we bypass the need to send large RAG contexts to the LLM, saving thousands of tokens per execution.
*   **Guaranteed Brand Voice:** The "Eco Poético" tone, social impact narratives, and approved vocabulary (e.g., "Poemas tejidos") are locked into the templates. This guarantees 100% adherence to the brand essence defined by the user (Shirley).
*   **Predictability:** Error handling is simpler. If a variable is missing, we can mechanically switch to a fallback template without relying on the LLM to hallucinate a workaround.
*   **Simplification:** Removes the immediate need to maintain and scale a vector database (pgvector) for marketing copy.

## 5. Consequences

*   **Less Spontaneous Creativity:** The captions are drawn from a finite pool of templates, which may seem repetitive if the bank is not updated periodically.
*   **Maintenance:** Shirley or the system administrator will need to manually add new templates to the bank over time to keep the content fresh.
*   **Data Migration:** Technical data and hashtag strategies that resided in the RAG prompts were migrated into `specs/brand_essence.md` to ensure knowledge was not lost.

## 6. Status
Accepted / Implemented (Architecture v2.1)
