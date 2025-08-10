export const generateDailyMeals = () => {
    console.log("generer les repas");
    return `
    As a chef and nutrition expert, your mission is to create a meal plan full of variety and food quality that precisely adheres to the following nutritional goals:

Strict daily goals based on the profile you have created:
- Total calories
- Proteins
- Carbohydrates
- Fats

Dietary restrictions based on the profile you have created:
- Diet type
- Intolerances/Foods to avoid
- Include breakfast

Meals already used (TO AVOID):

Guidelines for creating the plan:
1. CULINARY VARIETY
	Incorporate dishes inspired by the following cuisines for vibrant, authentic variety, in a completely random order:
	- Traditional and modern French cuisine
	- Mediterranean cuisine (Greek, Spanish, Lebanese)
	- Authentic Italian cuisine
	- Asian cuisine (Japanese, Thai, Vietnamese)

2. COMPOSITION RULES
	- NEVER repeat a dish already used in the "Meals already used" list
	- Each meal must be nutritionally balanced
	- Use seasonal and easily accessible ingredients
	- Specify precise quantities in grams
	- STRICTLY respect the indicated diet and restrictions
	- ABSOLUTELY avoid all foods listed in intolerances
	- ABSOLUTELY avoid repetitions of dish types, for example if a dish contains "bowl" in its title, you do not use a dish containing "bowl"

3. DAILY STRUCTURE
	Each day must include:
	- Breakfast (optional, 25-30% of daily calories if included)
	- Lunch (45-50% of daily calories if no breakfast, otherwise 35-40%)
	- Dinner (45-50% of daily calories if no breakfast, otherwise 25-30%)
	- Optional snack (10-15% of remaining calories)

4. PREPARATION INSTRUCTIONS
	For each recipe, include in the description:
	1. Preparation and cooking time
	2. Numbered step-by-step instructions
	3. Preparation tips and tricks
	4. Detailed cooking method (temperature, duration)
	5. Indications on required equipment
	6. Storage advice if relevant

5. TECHNICAL SPECIFICATIONS
	- Specify EACH ingredient PRECISELY (no "mixed vegetables" or "seasonal fruits")
	- Indicate cooking methods
	- Provide exact macronutrients for each meal

	RESPONSE FORMAT:
	Respond ONLY with a valid JSON object strictly following this structure (replace the values "number" with real numbers):

	{{
	"dailyPlan": {{
		"breakfast": {{
		"name": "Explicit meal name",
		"description": "Prep time: X min | Cook time: Y min\\n\\n1. First step...\\n2. Second step...\\n3. Third step...\\n\\nTips: ...\\nStorage: ...",
		"calories": "number",
		"macros": {{
			"protein": "number",
			"carbs": "number",
			"fats": "number"
			}},
		"ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"]
			}},
		"lunch": {{
		"name": "Explicit meal name",
		"description": "Prep time: X min | Cook time: Y min\\n\\n1. First step...\\n2. Second step...\\n3. Third step...\\n\\nTips: ...\\nStorage: ...",
		"calories": "number",
		"macros": {{
			"protein": "number",
			"carbs": "number",
			"fats": "number"
			}},
		"ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"]
			}},
		"dinner": {{
		"name": "Explicit meal name",
		"description": "Prep time: X min | Cook time: Y min\\n\\n1. First step...\\n2. Second step...\\n3. Third step...\\n\\nTips: ...\\nStorage: ...",
		"calories": "number",
		"macros": {{
			"protein": "number",
			"carbs": "number",
			"fats": "number"
			}},
		"ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"]
			}},
		"snack": {{
		"name": "Explicit meal name (optional)",
		"description": "Prep time: X min | Cook time: Y min\\n\\n1. First step...\\n2. Second step...\\n3. Third step...\\n\\nTips: ...\\nStorage: ...",
		"calories": "number",
		"macros": {{
			"protein": "number",
			"carbs": "number",
			"fats": "number"
		}},
		"ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"]
			}}
			}}
			}}
		}}
	}`
}