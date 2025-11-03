import { Plus, Trash2, Edit2, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

export interface Recipe {
  id: string
  name: string
  instructions?: string
  ingredients: {
    name: string
    quantity?: string
    unit?: string
  }[]
}

interface RecipeListProps {
  recipes: Recipe[]
  onAddRecipe: () => void
  onEditRecipe: (recipeId: string) => void
  onDeleteRecipe: (recipeId: string) => void
  onAddToShoppingList: (recipe: Recipe) => void
}

export default function RecipeList({
  recipes,
  onAddRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onAddToShoppingList,
}: RecipeListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-800">Recipes</h2>
        <Button onClick={onAddRecipe}>
          <Plus className="w-4 h-4 mr-2" />
          Add Recipe
        </Button>
      </div>

      {recipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-neutral-600 mb-4">No recipes yet</p>
            <Button onClick={onAddRecipe}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Recipe
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipes.map((recipe) => (
            <Card key={recipe.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{recipe.name}</CardTitle>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditRecipe(recipe.id)}
                      className="p-1 hover:bg-neutral-100 rounded"
                      title="Edit recipe"
                    >
                      <Edit2 className="w-4 h-4 text-neutral-500" />
                    </button>
                    <button
                      onClick={() => onDeleteRecipe(recipe.id)}
                      className="p-1 hover:bg-neutral-100 rounded"
                      title="Delete recipe"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-neutral-700 mb-2">
                    Ingredients ({recipe.ingredients.length})
                  </h4>
                  <ul className="text-sm text-neutral-600 space-y-1">
                    {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                      <li key={idx}>
                        {ing.quantity && `${ing.quantity} `}
                        {ing.unit && `${ing.unit} `}
                        {ing.name}
                      </li>
                    ))}
                    {recipe.ingredients.length > 3 && (
                      <li className="text-neutral-500 italic">
                        +{recipe.ingredients.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>

                {recipe.instructions && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-neutral-700 mb-2">
                      Instructions
                    </h4>
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {recipe.instructions}
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => onAddToShoppingList(recipe)}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Shopping List
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
