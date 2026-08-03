import OpenAI from "openai";
import { UpstreamAIError } from "../errors/app-error.js";

/**
 * Thin wrapper around the OpenAI Responses API.
 *
 * Deliberately has no knowledge of business-plan/questionnaire concepts —
 * callers pass a prompt and a JSON Schema, and get back the raw JSON text
 * the model produced. Callers are responsible for parsing/validating that
 * text against their own schema (e.g. with zod).
 */

let cachedClient: OpenAI | undefined;

function getClient(): OpenAI {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    throw new UpstreamAIError("OPENAI_API_KEY is not configured");
  }

  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

/** JSON Schema describing the shape the model's output must conform to. */
export interface JsonSchemaFormat {
  /** Short identifier for the schema, required by the Responses API. */
  name: string;
  /** A valid JSON Schema object (subset supported by OpenAI Structured Outputs). */
  schema: Record<string, unknown>;
  /** Defaults to true — enforce exact schema adherence. */
  strict?: boolean;
}

export interface CreateStructuredResponseParams {
  /** Model name, e.g. "gpt-4o-2024-08-06". */
  model: string;
  /** System-level instructions for the model. */
  instructions?: string;
  /** The user-facing input/prompt. */
  input: string;
  /** JSON Schema the response must match. */
  format: JsonSchemaFormat;
  /** Sampling temperature, if the caller wants deterministic-ish output. */
  temperature?: number;
}

/**
 * Calls the Responses API with Structured Outputs enabled and returns the
 * raw JSON string the model produced. Throws UpstreamAIError on any
 * network/API failure or if the model returns no text (e.g. a refusal).
 */
export async function createStructuredResponse(
  params: CreateStructuredResponseParams,
): Promise<string> {
  const client = getClient();

  // Built up conditionally (rather than passing `instructions: undefined`)
  // because the SDK's types use exactOptionalPropertyTypes-sensitive
  // optional fields — explicitly assigning `undefined` is rejected.
  const request: OpenAI.Responses.ResponseCreateParamsNonStreaming = {
    model: params.model,
    input: params.input,
    text: {
      format: {
        type: "json_schema",
        name: params.format.name,
        schema: params.format.schema,
        strict: params.format.strict ?? true,
      },
    },
    ...(params.instructions !== undefined ? { instructions: params.instructions } : {}),
    ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
  };

  let response: OpenAI.Responses.Response;
  try {
    response = await client.responses.create(request);
  } catch (error) {
    throw new UpstreamAIError("OpenAI request failed", error);
  }

  if (response.status === "incomplete") {
    const reason = response.incomplete_details?.reason ?? "unknown reason";
    throw new UpstreamAIError(`OpenAI response was incomplete: ${reason}`);
  }

  const text = response.output_text;
  if (!text) {
    throw new UpstreamAIError("OpenAI response contained no output text");
  }

  return text;
}
