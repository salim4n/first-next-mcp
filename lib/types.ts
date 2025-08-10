import { z } from "zod";

export const Gender = z.enum(["male", "female"]);
export const Objective = z.enum(["muscleGain", "weightLoss", "maintenance"]);
export const MacronutrientRatios = z.object({
	calories: z.number(),
	protein: z.number(),
	fat: z.number(),
	carbohydrates: z.number()
});
export const DietType = z.enum(["vegetarian", "vegan", "noPork", "none"]);

export const Profile = z.object({
	gender: Gender,
	age: z.number(),
	weight: z.number(),
	height: z.number(),
	activityLevel: z.number(),
	objective: Objective,
	dietType: DietType,
	intolerances: z.string()
});