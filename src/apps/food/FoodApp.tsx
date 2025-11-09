import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import RecipeList, { Recipe } from './components/RecipeList'
import ShoppingListView, { ShoppingList } from './components/ShoppingListView'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useWorkspace } from '@/lib/WorkspaceContext'

type TabType = 'recipes' | 'shopping'

export default function FoodApp() {
  const { workspaceId, userId } = useWorkspace()
  const [activeTab, setActiveTab] = useState<TabType>('recipes')

  // Recipes from Convex
  const recipesData = useQuery(api.food.listRecipes, workspaceId ? { workspaceId } : 'skip') as any[] | 'skip' | undefined
  const recipes: Recipe[] = Array.isArray(recipesData)
    ? recipesData.map((r: any) => ({
        id: r._id,
        name: r.name,
        instructions: r.instructions,
        ingredients: (r.ingredients || []).map((ing: any) => ({ name: ing.ingredientName, quantity: ing.quantity, unit: ing.unit })),
      }))
    : []
  const createRecipe = useMutation(api.food.createRecipe)
  const updateRecipe = useMutation(api.food.updateRecipe)
  const deleteRecipe = useMutation(api.food.deleteRecipe)
  const addRecipeIngredient = useMutation(api.food.addRecipeIngredient)

  // Recipe modal state
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null)
  const [recipeForm, setRecipeForm] = useState<{ name: string; instructions?: string; ingredients: { name: string; quantity?: string; unit?: string }[] }>({ name: '', instructions: '', ingredients: [] })

  const listsData = useQuery(api.food.listShoppingLists, workspaceId ? { workspaceId } : 'skip') as any[] | 'skip' | undefined
  const shoppingLists: ShoppingList[] = Array.isArray(listsData)
    ? listsData.map((l: any) => ({ id: l._id, name: l.name, items: (l.items || []).map((it: any) => ({ id: it._id, ingredientName: it.ingredientName, quantity: it.quantity, unit: it.unit, completed: it.completed, recipeSourceId: it.recipeSourceId })) }))
    : []
  const createList = useMutation(api.food.createShoppingList)
  const addItem = useMutation(api.food.addItemToShoppingList)
  const toggleItem = useMutation(api.food.toggleShoppingItem)
  const deleteItem = useMutation(api.food.deleteShoppingItem)
  const deleteList = useMutation(api.food.deleteShoppingList)

  const handleAddToShoppingList = async (recipe: Recipe) => {
    if (!workspaceId || !userId) return
    // Add directly to the first list; if none, create one first.
    let targetListId: any = shoppingLists[0]?.id
    if (!targetListId) {
      targetListId = await createList({ workspaceId: workspaceId as any, userId: userId as any, name: 'Shopping List' })
    }
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

  const handleToggleItem = async (_listId: string, itemId: string) => {
    await toggleItem({ itemId: itemId as any })
  }

  const handleDeleteItem = async (_listId: string, itemId: string) => {
    await deleteItem({ itemId: itemId as any })
  }

  const handleDeleteList = async (listId: string) => {
    if (confirm('Are you sure you want to delete this shopping list and all its items?')) {
      await deleteList({ shoppingListId: listId as any })
    }
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
            onAddRecipe={() => {
              setEditingRecipeId(null)
              setRecipeForm({ name: '', instructions: '', ingredients: [] })
              setShowRecipeModal(true)
            }}
            onEditRecipe={(id) => {
              const r = recipes.find(x => x.id === id)
              if (!r) return
              setEditingRecipeId(id)
              setRecipeForm({ name: r.name, instructions: r.instructions, ingredients: r.ingredients })
              setShowRecipeModal(true)
            }}
            onDeleteRecipe={async (id) => {
              await deleteRecipe({ recipeId: id as any })
            }}
            onAddToShoppingList={handleAddToShoppingList}
            onAddIngredient={async (recipeId, ing) => {
              await addRecipeIngredient({ recipeId: recipeId as any, ingredientName: ing.name, quantity: ing.quantity, unit: ing.unit })
            }}
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

        {showRecipeModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-neutral-800">{editingRecipeId ? 'Edit Recipe' : 'Add Recipe'}</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Name</label>
                  <input
                    className="h-10 w-full rounded-md border border-neutral-300 px-3 text-sm"
                    value={recipeForm.name}
                    onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Instructions (optional)</label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    value={recipeForm.instructions || ''}
                    onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                  />
                </div>
                <div className="p-3 border border-neutral-200 rounded-lg">
                  <div className="text-sm font-medium text-neutral-700 mb-2">Ingredients</div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input id="newIngName" placeholder="Ingredient" className="h-10 rounded-md border border-neutral-300 px-3 text-sm" />
                    <input id="newIngQty" placeholder="Qty" className="h-10 rounded-md border border-neutral-300 px-3 text-sm" />
                    <input id="newIngUnit" placeholder="Unit" className="h-10 rounded-md border border-neutral-300 px-3 text-sm" />
                    <button
                      className="h-10 rounded-md bg-neutral-900 text-white px-4 text-sm"
                      onClick={() => {
                        const nameEl = document.getElementById('newIngName') as HTMLInputElement
                        const qtyEl = document.getElementById('newIngQty') as HTMLInputElement
                        const unitEl = document.getElementById('newIngUnit') as HTMLInputElement
                        const name = nameEl?.value?.trim()
                        if (!name) return
                        setRecipeForm({ ...recipeForm, ingredients: [...recipeForm.ingredients, { name, quantity: qtyEl?.value || undefined, unit: unitEl?.value || undefined }] })
                        if (nameEl) nameEl.value = ''
                        if (qtyEl) qtyEl.value = ''
                        if (unitEl) unitEl.value = ''
                      }}
                    >
                      Add Ingredient
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {recipeForm.ingredients.map((ing, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                        <input
                          className="h-9 rounded-md border border-neutral-300 px-3 text-sm"
                          value={ing.name}
                          onChange={(e) => {
                            const next = [...recipeForm.ingredients]
                            next[idx] = { ...ing, name: e.target.value }
                            setRecipeForm({ ...recipeForm, ingredients: next })
                          }}
                        />
                        <input
                          className="h-9 rounded-md border border-neutral-300 px-3 text-sm"
                          value={ing.quantity || ''}
                          placeholder="Qty"
                          onChange={(e) => {
                            const next = [...recipeForm.ingredients]
                            next[idx] = { ...ing, quantity: e.target.value }
                            setRecipeForm({ ...recipeForm, ingredients: next })
                          }}
                        />
                        <input
                          className="h-9 rounded-md border border-neutral-300 px-3 text-sm"
                          value={ing.unit || ''}
                          placeholder="Unit"
                          onChange={(e) => {
                            const next = [...recipeForm.ingredients]
                            next[idx] = { ...ing, unit: e.target.value }
                            setRecipeForm({ ...recipeForm, ingredients: next })
                          }}
                        />
                        <button
                          className="h-9 rounded-md border border-neutral-300 px-3 text-sm"
                          onClick={async () => {
                            // If editing existing recipe, persist edited ingredient immediately
                            if (editingRecipeId) {
                              await addRecipeIngredient({ recipeId: editingRecipeId as any, ingredientName: ing.name, quantity: ing.quantity, unit: ing.unit })
                            }
                          }}
                        >
                          Save Row
                        </button>
                        <button
                          className="h-9 rounded-md border border-red-300 text-red-700 px-3 text-sm"
                          onClick={async () => {
                            const next = [...recipeForm.ingredients]
                            next.splice(idx, 1)
                            setRecipeForm({ ...recipeForm, ingredients: next })
                            // If editing existing recipe and ingredient has been persisted, we’d call deleteRecipeIngredient here when we track ids
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t flex gap-3">
                <button onClick={() => setShowRecipeModal(false)} className="flex-1 h-10 px-4 rounded-md border border-neutral-300">Cancel</button>
                <button
                  onClick={async () => {
                    if (!workspaceId || !userId || !recipeForm.name) return
                    if (editingRecipeId) {
                      await updateRecipe({ recipeId: editingRecipeId as any, name: recipeForm.name, instructions: recipeForm.instructions })
                      // New ingredients added in modal are only queued locally; add them now as separate inserts
                      for (const ing of recipeForm.ingredients) {
                        await addRecipeIngredient({ recipeId: editingRecipeId as any, ingredientName: ing.name, quantity: ing.quantity, unit: ing.unit })
                      }
                    } else {
                      await createRecipe({
                        workspaceId: workspaceId as any,
                        userId: userId as any,
                        name: recipeForm.name,
                        instructions: recipeForm.instructions,
                        ingredients: recipeForm.ingredients.map(ing => ({ ingredientName: ing.name, quantity: ing.quantity, unit: ing.unit }))
                      })
                    }
                    setShowRecipeModal(false)
                    setEditingRecipeId(null)
                    setRecipeForm({ name: '', instructions: '', ingredients: [] })
                  }}
                  className="flex-1 h-10 px-4 rounded-md bg-neutral-900 text-white"
                >
                  Save Recipe
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
