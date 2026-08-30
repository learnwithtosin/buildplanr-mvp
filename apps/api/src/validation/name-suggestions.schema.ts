import { z } from "zod";

/** Shape we ask the model to produce for POST /api/business-plans/:id/name-suggestions. */
export const generatedNameSuggestionsSchema = z.object({
  suggestions: z.array(z.string().min(1)).length(3),
});

export type GeneratedNameSuggestions = z.infer<typeof generatedNameSuggestionsSchema>;
