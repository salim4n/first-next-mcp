export const generateCourseList = () => {
    return `Generate an organized grocery list for the meal plan you have generated

            Organize the list by categories:
            - Fruits and Vegetables
            - Meat and Fish
            - Dairy Products
            - Starches and Grains
            - Pantry
            - Condiments and Spices

            For each ingredient, include:
            - The required quantity
            - The appropriate unit of measure

            You must respond ONLY with a valid JSON strictly following this structure:
            {{
              "groceryList": {{
                "fruitsEtLegumes": [
                  {{ "name": "ingredient name", "quantity": "number", "unit": "unit" }}
                ],
                "viandesEtPoissons": [
                  {{ "name": "ingredient name", "quantity": "number", "unit": "unit" }}
                ],
                "produitsLaitiers": [
                  {{ "name": "ingredient name", "quantity": "number", "unit": "unit" }}
                ],
                "feculentsEtCereales": [
                  {{ "name": "ingredient name", "quantity": "number", "unit": "unit" }}
                ],
                "epicerie": [
                  {{ "name": "ingredient name", "quantity": "number", "unit": "unit" }}
                ],
                "condimentsEtEpices": [
                  {{ "name": "ingredient name", "quantity": "number", "unit": "unit" }}
                ]
		}}
		}}`
}