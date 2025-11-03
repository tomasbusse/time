import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Recipes
export const listRecipes = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const recipesWithIngredients = await Promise.all(
      recipes.map(async (recipe) => {
        const ingredients = await ctx.db
          .query("recipeIngredients")
          .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
          .collect();
        return { ...recipe, ingredients };
      })
    );

    return recipesWithIngredients;
  },
});

export const updateRecipe = mutation({
  args: {
    recipeId: v.id("recipes"),
    name: v.optional(v.string()),
    instructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { recipeId, ...updates } = args as any;
    await ctx.db.patch(recipeId, {
      ...updates,
      updatedAt: Date.now(),
    });
    return recipeId;
  },
});

export const deleteRecipe = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    // delete ingredients first
    const ings = await ctx.db
      .query("recipeIngredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();
    await Promise.all(ings.map((ing) => ctx.db.delete(ing._id)));
    await ctx.db.delete(args.recipeId);
    return args.recipeId;
  },
});

export const addRecipeIngredient = mutation({
  args: {
    recipeId: v.id("recipes"),
    ingredientName: v.string(),
    quantity: v.optional(v.string()),
    unit: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recipeIngredients", {
      recipeId: args.recipeId,
      ingredientName: args.ingredientName,
      quantity: args.quantity,
      unit: args.unit,
    });
  },
});

export const createRecipe = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    name: v.string(),
    instructions: v.optional(v.string()),
    ingredients: v.array(
      v.object({
        ingredientName: v.string(),
        quantity: v.optional(v.string()),
        unit: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { ingredients, ...recipeData } = args;
    
    const recipeId = await ctx.db.insert("recipes", {
      ...recipeData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await Promise.all(
      ingredients.map((ing) =>
        ctx.db.insert("recipeIngredients", {
          recipeId,
          ...ing,
        })
      )
    );

    return recipeId;
  },
});

// Shopping Lists
export const listShoppingLists = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const lists = await ctx.db
      .query("shoppingLists")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const listsWithItems = await Promise.all(
      lists.map(async (list) => {
        const items = await ctx.db
          .query("shoppingListItems")
          .withIndex("by_shopping_list", (q) => q.eq("shoppingListId", list._id))
          .collect();
        return { ...list, items };
      })
    );

    return listsWithItems;
  },
});

export const createShoppingList = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("shoppingLists", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const addItemToShoppingList = mutation({
  args: {
    shoppingListId: v.id("shoppingLists"),
    ingredientName: v.string(),
    quantity: v.optional(v.string()),
    unit: v.optional(v.string()),
    recipeSourceId: v.optional(v.id("recipes")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("shoppingListItems", {
      ...args,
      completed: false,
      createdAt: Date.now(),
    });
  },
});

export const toggleShoppingItem = mutation({
  args: {
    itemId: v.id("shoppingListItems"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");
    
    return await ctx.db.patch(args.itemId, {
      completed: !item.completed,
    });
  },
});

export const deleteShoppingItem = mutation({
  args: { itemId: v.id("shoppingListItems") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.itemId);
  },
});
