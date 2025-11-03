import { Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

export interface ShoppingListItem {
  id: string
  ingredientName: string
  quantity?: string
  unit?: string
  completed: boolean
  recipeSourceId?: string
}

export interface ShoppingList {
  id: string
  name: string
  items: ShoppingListItem[]
}

interface ShoppingListViewProps {
  shoppingLists: ShoppingList[]
  onAddList: () => void
  onDeleteList: (listId: string) => void
  onToggleItem: (listId: string, itemId: string) => void
  onDeleteItem: (listId: string, itemId: string) => void
  onAddItem?: (listId: string, item: { ingredientName: string; quantity?: string; unit?: string }) => void
}

export default function ShoppingListView({
  shoppingLists,
  onAddList,
  onDeleteList,
  onToggleItem,
  onDeleteItem,
  onAddItem,
}: ShoppingListViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-800">Shopping Lists</h2>
        <Button onClick={onAddList}>Add List</Button>
      </div>

      {shoppingLists.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-neutral-600 mb-4">No shopping lists yet</p>
            <Button onClick={onAddList}>Create Your First List</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {shoppingLists.map((list) => {
            const completedItems = list.items.filter((item) => item.completed).length
            const totalItems = list.items.length

            return (
              <Card key={list.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{list.name}</CardTitle>
                      <p className="text-sm text-neutral-500 mt-1">
                        {completedItems} / {totalItems} items completed
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteList(list.id)}
                      className="p-2 hover:bg-neutral-100 rounded"
                      title="Delete list"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {list.items.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-4">
                      No items in this list
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {list.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                            item.completed
                              ? 'bg-neutral-50 border-neutral-200'
                              : 'bg-white border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          <button
                            onClick={() => onToggleItem(list.id, item.id)}
                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              item.completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-neutral-300 hover:border-green-500'
                            }`}
                          >
                            {item.completed && <Check className="w-3 h-3 text-white" />}
                          </button>

                          <div className="flex-1">
                            <span
                              className={`${
                                item.completed
                                  ? 'line-through text-neutral-500'
                                  : 'text-neutral-800'
                              }`}
                            >
                              {item.quantity && `${item.quantity} `}
                              {item.unit && `${item.unit} `}
                              {item.ingredientName}
                            </span>
                            {item.recipeSourceId && (
                              <span className="ml-2 text-xs text-blue-600">
                                (from recipe)
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => onDeleteItem(list.id, item.id)}
                            className="p-1 hover:bg-neutral-200 rounded"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4 text-neutral-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {completedItems === totalItems && totalItems > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 font-medium">
                        ✓ All items completed!
                      </p>
                    </div>
                  )}

                  {/* Add item inline form */}
                  <div className="mt-4 p-3 border border-neutral-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <input
                        placeholder="Item name"
                        className="h-10 rounded-md border border-neutral-300 px-3 text-sm"
                        onKeyDown={(e) => {
                          // store temporary values on DOM element dataset
                          const t = e.target as HTMLInputElement
                          ;(t as any)._val = t.value
                        }}
                        onChange={(e) => ((e.target as any)._val = e.target.value)}
                        id={`name-${list.id}`}
                      />
                      <input
                        placeholder="Qty"
                        className="h-10 rounded-md border border-neutral-300 px-3 text-sm"
                        onChange={(e) => ((e.target as any)._val = e.target.value)}
                        id={`qty-${list.id}`}
                      />
                      <input
                        placeholder="Unit"
                        className="h-10 rounded-md border border-neutral-300 px-3 text-sm"
                        onChange={(e) => ((e.target as any)._val = e.target.value)}
                        id={`unit-${list.id}`}
                      />
                      <button
                        className="h-10 rounded-md bg-neutral-900 text-white px-4 text-sm"
                        onClick={() => {
                          const nameEl = document.getElementById(`name-${list.id}`) as any
                          const qtyEl = document.getElementById(`qty-${list.id}`) as any
                          const unitEl = document.getElementById(`unit-${list.id}`) as any
                          const name = nameEl?._val || nameEl?.value
                          const quantity = qtyEl?._val || qtyEl?.value
                          const unit = unitEl?._val || unitEl?.value
                          if (!name) return
                          onAddItem?.(list.id, { ingredientName: name, quantity, unit })
                          if (nameEl) nameEl.value = ''
                          if (qtyEl) qtyEl.value = ''
                          if (unitEl) unitEl.value = ''
                        }}
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
