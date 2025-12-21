'use server';

import { z } from "zod";
import { ai } from "../genkit";

export const chat = ai.defineFlow(
  {
    name: "chat",
    inputSchema: z.object({
      history: z.array(
        z.object({
          role: z.enum(["user", "model"]),
          parts: z.array(
            z.object({
              text: z.string(),
            })
          ),
        })
      ),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const response = await ai.generate({
      model: ai.model,
      messages: input.history,
    });

    return response.text;
  }
);
