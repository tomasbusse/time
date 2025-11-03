import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import RecipeList, { Recipe } from './components/RecipeList'
import ShoppingListView, { ShoppingList, ShoppingListItem } from './components/ShoppingListView'

type TabType = 'recipes' | 'shopping'

export default function FoodApp() {
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

  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([
    {
      id: '1',
      name: 'Weekly Groceries',
      items: [
        {
          id: '1',
          ingredientName: 'Milk',
          quantity: '2',
          unit: 'L',
          completed: false,
        },
        {
          id: '2',
          ingredientName: 'Bread',
          quantity: '1',
          unit: 'loaf',
          completed: true,
        },
      ],
    },
  ])

  const handleAddToShoppingList = (recipe: Recipe) => {
    const defaultList = shoppingLists[0]
    if (!defaultList) {
      const newList: ShoppingList = {
        id: Date.now().toString(),
        name: 'Shopping List',
        items: recipe.ingredients.map((ing, idx) => ({
          id: `${Date.now()}-${idx}`,
          ingredientName: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          completed: false,
          recipeSourceId: recipe.id,
        })),
      }
      setShoppingLists([newList])
    } else {
      const newItems: ShoppingListItem[] = recipe.ingredients.map((ing, idx) => ({
        id: `${Date.now()}-${idx}`,
        ingredientName: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        completed: false,
        recipeSourceId: recipe.id,
      }))

      setShoppingLists(
        shoppingLists.map((list) =>
          list.id === defaultList.id
            ? { ...list, items: [...list.items, ...newItems] }
            : list
        )
      )
    }

    setActiveTab('shopping')
  }

  const handleToggleItem = (listId: string, itemId: string) => {
    setShoppingLists(
      shoppingLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              ),
            }
          : list
      )
    )
  }

  const handleDeleteItem = (listId: string, itemId: string) => {
    setShoppingLists(
      shoppingLists.map((list) =>
        list.id === listId
          ? { ...list, items: list.items.filter((item) => item.id !== itemId) }
          : list
      )
    )
  }

  const handleDeleteList = (listId: string) => {
    if (confirm('Are you sure you want to delete this shopping list?')) {
      setShoppingLists(shoppingLists.filter((list) => list.id !== listId))
    }
  }

  const handleAddList = () => {
    const newList: ShoppingList = {
      id: Date.now().toString(),
      name: `Shopping List ${shoppingLists.length + 1}`,
      items: [],
    }
    setShoppingLists([...shoppingLists, newList])
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
          />
        )}
      </div>
    </div>
  )
}
