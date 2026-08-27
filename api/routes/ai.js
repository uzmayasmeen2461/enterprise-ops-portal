'use strict';

// ─── /api/ai route ────────────────────────────────────────────────────────────
// POST /api/ai/search
//   Body:    { query: string }
//   Returns: { filters: AiSearchResult, interpretation: string, confidence: string }
//
// This route is the ONLY place the AI API key is used.
// It never appears in any response sent back to the browser.

const express = require('express');
const router  = express.Router();

// ── Allowed filter values ─────────────────────────────────────────────────────
// These mirror the TypeScript types in the Angular frontend exactly.
// Any value the LLM returns that is NOT in these sets gets stripped out
// before we send the response to Angular.

const ALLOWED_STATUSES    = new Set(['COMPLETED', 'FAILED', 'PENDING', 'PROCESSING']);
const ALLOWED_PRIORITIES  = new Set(['HIGH', 'MEDIUM', 'LOW']);
const ALLOWED_SOURCES     = new Set(['CORE_SYS', 'PAYMENT_HUB', 'ORDER_GATEWAY', 'PROCESSING_ENGINE']);
const DATE_REGEX          = /^\d{4}-\d{2}-\d{2}$/;   // YYYY-MM-DD

// ── System prompt ─────────────────────────────────────────────────────────────
// This is sent to the LLM on every request as the "system" role message.
// It strictly constrains the model's output to valid JSON matching our schema.
//
// Key design principles:
//   1. Tell the model exactly what to return and what NOT to return.
//   2. Provide synonym mappings so the model normalises user language.
//   3. Provide a concrete output example.
//   4. Never trust the model to follow instructions perfectly — we validate anyway.

const SYSTEM_PROMPT = `
You are a structured-filter extraction assistant for an Enterprise Operations Management portal.

Your job is to interpret a natural-language search query and return ONLY a JSON object containing the structured search filters that match the user's intent.

## Supported filter fields

Return only fields from this list. If a field cannot be determined from the query, omit it entirely.

| Field         | Type   | Allowed values                                      |
|---------------|--------|-----------------------------------------------------|
| status        | string | COMPLETED, FAILED, PENDING, PROCESSING              |
| priority      | string | HIGH, MEDIUM, LOW                                   |
| sourceSystem  | string | CORE_SYS, PAYMENT_HUB, ORDER_GATEWAY, PROCESSING_ENGINE |
| operationId   | string | e.g. OP-00042                                       |
| createdFrom   | string | YYYY-MM-DD                                          |
| createdTo     | string | YYYY-MM-DD                                          |

## Synonym mappings — apply these automatically

Status synonyms:
- finished, done, successful, succeeded, success → COMPLETED
- failed, failure, error, broken, errored        → FAILED
- waiting, queued, on hold, not started          → PENDING
- running, in progress, active, processing       → PROCESSING

Priority synonyms:
- urgent, critical, high priority, important     → HIGH
- normal, medium priority, standard              → MEDIUM
- minor, low priority, not urgent                → LOW

Date instructions:
- "today" → set createdFrom and createdTo to today's date in YYYY-MM-DD format
- "yesterday" → set both to yesterday's date in YYYY-MM-DD format
- "this week" → set createdFrom to Monday of the current week, createdTo to today
- "last week" → set createdFrom to Monday of last week, createdTo to Sunday of last week
- "this month" → set createdFrom to the 1st of the current month, createdTo to today

## Output rules

- Return ONLY valid JSON. No Markdown. No code fences. No explanation.
- Do not include fields you are not confident about.
- Do not invent values. If no valid value can be determined for a field, omit the field.
- If nothing can be determined from the query, return an empty object: {}

## Example

Query: "show failed high priority operations from payment hub created this week"

Today is 2026-08-25 (Monday). This week: 2026-08-25 to 2026-08-25.

Output:
{"status":"FAILED","priority":"HIGH","sourceSystem":"PAYMENT_HUB","createdFrom":"2026-08-25","createdTo":"2026-08-25"}
`.trim();

// ── POST /api/ai/search ───────────────────────────────────────────────────────
router.post('/search', async (req, res, next) => {
  const { query } = req.body;

  // ── Input validation ────────────────────────────────────────────────────────
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'query is required and must be a non-empty string' });
  }

  const trimmedQuery = query.trim().slice(0, 500); // hard cap — prevent prompt injection via length

  try {
    // ── Call the AI provider ──────────────────────────────────────────────────
    // We use the native fetch() available in Node.js 18+.
    // No SDK needed — keeps dependencies minimal and transparent.

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const aiResponse = await fetch(`${process.env.AI_BASE_URL}/chat/completions`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`
        // ↑ The API key is ONLY ever sent from this server to the AI provider.
        //   It never appears in any response to the browser.
      },
      body: JSON.stringify({
        model:       process.env.AI_MODEL || 'gpt-4o-mini',
        temperature: 0,       // 0 = deterministic — we want consistent structured output
        max_tokens:  256,     // filters JSON is always small
        messages: [
          {
            role:    'system',
            content: SYSTEM_PROMPT
          },
          {
            role:    'user',
            // Inject today's date into the user message so relative date instructions work
            content: `Today's date is ${today}.\n\nQuery: ${trimmedQuery}`
          }
        ]
      })
    });

    // ── Handle AI provider errors ─────────────────────────────────────────────
    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      console.error(`[AI] Provider returned ${aiResponse.status}:`, errBody);
      return res.status(502).json({
        error: 'AI provider returned an error. Please try again.'
      });
    }

    const aiData = await aiResponse.json();

    // ── Extract the raw text from the LLM response ────────────────────────────
    const rawText = aiData?.choices?.[0]?.message?.content?.trim() ?? '';

    if (!rawText) {
      console.error('[AI] Empty response from model');
      return res.status(502).json({ error: 'AI returned an empty response.' });
    }

    // ── Parse the JSON the model returned ────────────────────────────────────
    let parsed;
    try {
      // Strip markdown code fences if the model ignored our instructions
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();

      parsed = JSON.parse(cleaned);
    } catch {
      console.error('[AI] Could not parse model response as JSON:', rawText);
      return res.status(502).json({
        error: 'AI returned an unrecognisable response. Please rephrase your query.'
      });
    }

    // ── Validate and sanitise ─────────────────────────────────────────────────
    // NEVER blindly pass the LLM's response to the client.
    // Check every field against the allowed set and strip anything invalid.
    // This prevents prompt injection attacks from polluting the UI.

    const filters = {};

    if (parsed.status && ALLOWED_STATUSES.has(parsed.status)) {
      filters.status = parsed.status;
    }
    if (parsed.priority && ALLOWED_PRIORITIES.has(parsed.priority)) {
      filters.priority = parsed.priority;
    }
    if (parsed.sourceSystem && ALLOWED_SOURCES.has(parsed.sourceSystem)) {
      filters.sourceSystem = parsed.sourceSystem;
    }
    if (parsed.operationId && typeof parsed.operationId === 'string') {
      filters.operationId = parsed.operationId.slice(0, 50); // cap length
    }
    if (parsed.createdFrom && DATE_REGEX.test(parsed.createdFrom)) {
      filters.createdFrom = parsed.createdFrom;
    }
    if (parsed.createdTo && DATE_REGEX.test(parsed.createdTo)) {
      filters.createdTo = parsed.createdTo;
    }

    // ── Build interpretation string ───────────────────────────────────────────
    const interpretedParts = Object.entries(filters).map(([k, v]) => `${k} → ${v}`);
    const interpretation = interpretedParts.length > 0
      ? `Understood: ${interpretedParts.join(', ')}`
      : 'No filters recognised — showing all operations';

    const confidence = interpretedParts.length > 0 ? 'HIGH' : 'LOW';

    // ── Send clean response to Angular ────────────────────────────────────────
    return res.json({ filters, interpretation, confidence });

  } catch (err) {
    // Network error, fetch threw, or unexpected exception
    console.error('[AI] Unexpected error:', err.message);
    next(err); // pass to Express global error handler
  }
});

module.exports = router;
