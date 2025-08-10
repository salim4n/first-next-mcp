// app/api/[transport]/route.ts
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { persistUsage } from "@/lib/usage/logger";
import { performance } from "node:perf_hooks";
import {
  calculMetabolism,
  calculRepartition,
  calculNutrition,
} from "../../../lib/tools/calculate";
import { Gender, Objective, Profile } from "../../../lib/types";
import { generateCourseList } from "@/lib/prompts/courseList";
import { generateDailyMeals } from "@/lib/prompts/dailyMeals";
const handler = createMcpHandler(
  (server) => {
    // Nutrition tools
    server.tool(
      "calcul_metabolism",
      "Calculates basal metabolism from gender, age, weight, height",
      {
        gender: Gender,
        age: z.number().int().positive(),
        weight: z.number().positive(),
        height: z.number().positive(),
      },
      async ({ gender, age, weight, height }) => {
        const startedAt = new Date().toISOString();
        const input = { gender, age, weight, height };
        const inputStr = JSON.stringify(input);
        const t0 = performance.now();
        try {
          const value = calculMetabolism(gender, age, weight, height);
          const result = { basalMetabolism: Math.round(value) };
          const outputStr = JSON.stringify(result);
          const computeMs = performance.now() - t0;
          await persistUsage({
            transport: "http",
            kind: "tool",
            name: "calcul_metabolism",
            success: true,
            startedAt,
            durationMs: computeMs,
            totalDurationMs: performance.now() - t0,
            inputChars: inputStr.length,
            outputChars: outputStr.length,
          });
          return {
            content: [
              { type: "text", text: outputStr },
            ],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          const computeMs = performance.now() - t0;
          await persistUsage({
            transport: "http",
            kind: "tool",
            name: "calcul_metabolism",
            success: false,
            startedAt,
            durationMs: computeMs,
            totalDurationMs: performance.now() - t0,
            inputChars: inputStr.length,
            errorMessage: msg,
          });
          throw err;
        }
      }
    );

    server.tool(
      "calcul_repartition",
      "Calculates macronutrient repartition for a goal and calories",
      {
        goal: Objective,
        calories: z.number().positive(),
      },
      async ({ goal, calories }) => {
        const startedAt = new Date().toISOString();
        const input = { goal, calories };
        const inputStr = JSON.stringify(input);
        const t0 = performance.now();
        try {
          const rep = calculRepartition(goal, calories);
          const outputStr = JSON.stringify(rep);
          const computeMs = performance.now() - t0;
          await persistUsage({
            transport: "http",
            kind: "tool",
            name: "calcul_repartition",
            success: true,
            startedAt,
            durationMs: computeMs,
            totalDurationMs: performance.now() - t0,
            inputChars: inputStr.length,
            outputChars: outputStr.length,
          });
          return {
            content: [
              { type: "text", text: outputStr },
            ],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          const computeMs = performance.now() - t0;
          await persistUsage({
            transport: "http",
            kind: "tool",
            name: "calcul_repartition",
            success: false,
            startedAt,
            durationMs: computeMs,
            totalDurationMs: performance.now() - t0,
            inputChars: inputStr.length,
            errorMessage: msg,
          });
          throw err;
        }
      }
    );

    server.tool(
      "calcul_nutrition",
      "Calculates full nutrition repartition from a complete profile",
      {
        profile: Profile,
      },
      async ({ profile }) => {
        const startedAt = new Date().toISOString();
        const inputStr = JSON.stringify({ profile });
        const t0 = performance.now();
        try {
          const rep = calculNutrition(profile);
          const outputStr = JSON.stringify(rep);
          const computeMs = performance.now() - t0;
          await persistUsage({
            transport: "http",
            kind: "tool",
            name: "calcul_nutrition",
            success: true,
            startedAt,
            durationMs: computeMs,
            totalDurationMs: performance.now() - t0,
            inputChars: inputStr.length,
            outputChars: outputStr.length,
          });
          return {
            content: [
              { type: "text", text: outputStr },
            ],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          const computeMs = performance.now() - t0;
          await persistUsage({
            transport: "http",
            kind: "tool",
            name: "calcul_nutrition",
            success: false,
            startedAt,
            durationMs: computeMs,
            totalDurationMs: performance.now() - t0,
            inputChars: inputStr.length,
            errorMessage: msg,
          });
          throw err;
        }
      }
    );

    server.prompt(
        "generateDailyMeals",
        () => {
          const startedAt = new Date().toISOString();
          const t0 = performance.now();
          const text = generateDailyMeals();
          const out = {
            messages: [{
              role: "user" as const,
              content: { type: "text" as const, text },
            }],
          };
          const computeMs = performance.now() - t0;
          return persistUsage({
            transport: "http",
            kind: "prompt",
            name: "generateDailyMeals",
            success: true,
            startedAt,
            durationMs: computeMs,
            totalDurationMs: performance.now() - t0,
            outputChars: text.length,
          }).then(() => out);
        }
      );
      
      server.prompt(
        "generateCourseList",
        () => {
          const startedAt = new Date().toISOString();
          const t0 = performance.now();
          const text = generateCourseList();
          const out = {
            messages: [{
              role: "user" as const,
              content: { type: "text" as const, text },
            }],
          };
          const computeMs = performance.now() - t0;
          return persistUsage({
            transport: "http",
            kind: "prompt",
            name: "generateCourseList",
            success: true,
            startedAt,
            durationMs: computeMs,
            totalDurationMs: performance.now() - t0,
            outputChars: text.length,
          }).then(() => out);
        }
      );
  },
  {
    // Optional server options
  },
  {
    basePath: "/api", // this needs to match where the [transport] is located.
    maxDuration: 60,
    verboseLogs: true,
  }
);
export { handler as GET, handler as POST };