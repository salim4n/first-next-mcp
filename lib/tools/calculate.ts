import { z } from "zod";
import { Gender, MacronutrientRatios, Objective, Profile } from "../types";


const calculMan = (poids: number, taille: number, age: number) =>
	1.083 *
	Math.pow(poids, 0.48) *
	Math.pow(taille / 100, 0.5) * 
	Math.pow(age, -0.13) *
	(1000 / 4.1855);

const calculWoman = (poids: number, taille: number, age: number) =>
	0.963 *
	Math.pow(poids, 0.48) *
	Math.pow(taille / 100, 0.5) * 
	Math.pow(age, -0.13) *
	(1000 / 4.1855);

export const calculMetabolism = (
	gender: z.infer<typeof Gender>,
	age: number,
	weight: number,
	height: number,
) =>
	gender === "female"
		? calculWoman(weight, height, age)
		: calculMan(weight, height, age);

export const calculRepartition = (goal: z.infer<typeof Objective>, calories: number): z.infer<typeof MacronutrientRatios> => {
	let caloriesTotal: number;
	let proteinRatio: number;
	let fatRatio: number;
	let carbohydrateRatio: number;

	switch (goal) {
		case "weightLoss":
			caloriesTotal = Math.round(calories * 0.9); // Reduction of 10% of calories
			proteinRatio = 0.25;
			fatRatio = 0.25;
			carbohydrateRatio = 0.5;
			break;

		case "muscleGain":
			caloriesTotal = Math.round(calories * 1.12); // Increase of 12% of calories
			proteinRatio = 0.3;
			fatRatio = 0.25;
			carbohydrateRatio = 0.45;
			break;

		case "maintenance":
			caloriesTotal = Math.round(calories);
			proteinRatio = 0.3;
			fatRatio = 0.3;
			carbohydrateRatio = 0.4;
			break;

		default:
			caloriesTotal = Math.round(calories);
			proteinRatio = 0.3;
			fatRatio = 0.3;
			carbohydrateRatio = 0.4;
	}
	
	// Calcul des macronutriments en grammes
	// 1g de protéines = 4 kcal
	// 1g de lipides = 9 kcal
	// 1g de glucides = 4 kcal
	const protein = Math.round((caloriesTotal * proteinRatio) / 4);
	const fat = Math.round((caloriesTotal * fatRatio) / 9);
	const carbohydrate = Math.round((caloriesTotal * carbohydrateRatio) / 4);
	
	const repartition: z.infer<typeof MacronutrientRatios> = {
        calories: caloriesTotal,
        protein,
        fat,
        carbohydrates: carbohydrate
	};

	return repartition;
};

/**
 * Calculates the complete nutritional distribution based on the user's profile
 * @param profile Complete profile of the user
 * @returns Complete nutritional distribution in grams
 */
export const calculNutrition = (profile: z.infer<typeof Profile>): z.infer<typeof MacronutrientRatios> => {
	// Calculates the basal metabolism
	const basalMetabolism = calculMetabolism(
		profile.gender,
		profile.age,
		profile.weight,
		profile.height
	);
	
	// Applies the activity level
	const caloriesTotal = basalMetabolism * profile.activityLevel;
	
	// Calculates the distribution based on the goal
	return calculRepartition(profile.objective, caloriesTotal);
};