import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import RecipeList, { Recipe } from './components/RecipeList'
import ShoppingListView, { ShoppingList, ShoppingListItem } from './components/ShoppingListView'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'

type TabType = 'recipes' | 'shopping'

export default function FoodApp() {
  const { workspaceId, userId } = useWorkspace()
  const [activeTab, setActiveTab] = useState<TabType>('recipes')

  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: '1',
      name: 'Spaghetti Carbonara',
      instructions: 'Cook pasta. Fry pancetta. Mix eggs and cheese. Combine all with pasta water.',
      ingredients: [
        { name: 'Spaghetti', quantity: '400', unit: 'g' },
        { name: 'Pancetta', quantity: '200', unit: 'g' },
        { name: 'Eggs', quantity: '4', unit: '' },
        { name: 'Parmesan cheese', quantity: '100', unit: 'g' },
        { name: 'Black pepper', quantity: '1', unit: 'tsp' },
      ],
    },
    {
      id: '2',
      name: 'Chicken Stir-Fry',
      instructions: 'Cut chicken and vegetables. Stir-fry in wok with sauce.',
      ingredients: [
        { name: 'Chicken breast', quantity: '500', unit: 'g' },
        { name: 'Bell peppers', quantity: '2', unit: '' },
        { name: 'Broccoli', quantity: '1', unit: 'head' },
        { name: 'Soy sauce', quantity: '3', unit: 'tbsp' },
        { name: 'Ginger', quantity: '1', unit: 'tbsp' },
      ],
    },
  ])

  const listsData = useQuery(api.food.listShoppingLists, workspaceId ? { workspaceId } : 'skip') as any[] | 'skip' | undefined
  const shoppingLists: ShoppingList[] = Array.isArray(listsData)
    ? listsData.map((l: any) => ({ id: l._id, name: l.name, items: (l.items || []).map((it: any) => ({ id: it._id, ingredientName: it.ingredientName, quantity: it.quantity, unit: it.unit, completed: it.completed, recipeSourceId: it.recipeSourceId })) }))
    : []
  const createList = useMutation(api.food.createShoppingList)
  const addItem = useMutation(api.food.addItemToShoppingList)
  const toggleItem = useMutation(api.food.toggleShoppingItem)
  const deleteItem = useMutation(api.food.deleteShoppingItem)

  const handleAddToShoppingList = async (recipe: Recipe) => {
    if (!workspaceId || !userId) return
    // Allow user to select target list; if none, create one first.
    let targetListId: any = shoppingLists[0]?.id
    if (!targetListId) {
      targetListId = await createList({ workspaceId: workspaceId as any, userId: userId as any, name: 'Shopping List' })
    }
    const listName = shoppingLists.find(l => l.id === targetListId)?.name || 'Shopping List'
    const confirmed = confirm(`Add ingredients from "${recipe.name}" to list: ${listName}?`)
    if (!confirmed) return
    for (const ing of recipe.ingredients) {
      await addItem({
        shoppingListId: targetListId,
        ingredientName: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        recipeSourceId: recipe.id as any,
      })
    }
    setActiveTab('shopping')
  }

  const handleToggleItem = async (listId: string, itemId: string) => {
    await toggleItem({ itemId: itemId as any })
  }

  const handleDeleteItem = async (listId: string, itemId: string) => {
    await deleteItem({ itemId: itemId as any })
  }

  const handleDeleteList = (listId: string) => {
    alert('Delete list coming soon')
  }

  const handleAddList = async () => {
    if (!workspaceId || !userId) return
    await createList({ workspaceId: workspaceId as any, userId: userId as any, name: `Shopping List ${shoppingLists.length + 1}` })
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-neutral-800 mb-8">Food & Shopping</h1>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-neutral-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('recipes')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'recipes'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                Recipes
              </button>
              <button
                onClick={() => setActiveTab('shopping')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'shopping'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-neutral-600 hover:text-neutral-800'
                }`}
              >
                Shopping Lists
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'recipes' && (
          <RecipeList
            recipes={recipes}
            onAddRecipe={() => alert('Add Recipe - Coming soon')}
            onEditRecipe={() => alert('Edit Recipe - Coming soon')}
            onDeleteRecipe={(id) => setRecipes(recipes.filter((r) => r.id !== id))}
            onAddToShoppingList={handleAddToShoppingList}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingListView
            shoppingLists={shoppingLists}
            onAddList={handleAddList}
            onDeleteList={handleDeleteList}
            onToggleItem={handleToggleItem}
            onDeleteItem={handleDeleteItem}
            onAddItem={async (listId, item) => {
              await addItem({
                shoppingListId: listId as any,
                ingredientName: item.ingredientName,
                quantity: item.quantity,
                unit: item.unit,
              })
            }}
          />
        )}
      </div>
    </div>
  )
}
