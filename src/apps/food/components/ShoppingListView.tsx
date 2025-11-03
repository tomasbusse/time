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
}

export default function ShoppingListView({
  shoppingLists,
  onAddList,
  onDeleteList,
  onToggleItem,
  onDeleteItem,
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
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
