export type FridgeItem = {
  id: string
  user_id: string
  name: string
  quantity: number
  unit: string
  expiry_date: string | null
  category: string
  created_at: string
}

export type Ingredient = {
  name: string
  amount: string
  unit: string
}

export type RecipeStep = {
  step: number
  instruction: string
}

export type Recipe = {
  id: string
  title: string
  description: string | null
  ingredients: Ingredient[]
  steps: RecipeStep[]
  image_url: string | null
  cook_time_minutes: number
  tags: string[]
  created_by: string | null
  created_at: string
  // External recipe metadata (TheMealDB, Spoonacular, Edamam)
  source?: string
  source_url?: string
}

export type SocialPost = {
  id: string
  user_id: string
  recipe_id: string | null
  image_url: string | null
  caption: string
  created_at: string
  recipes?: Recipe
  user_email?: string
  likes_count: number
  user_liked: boolean
}

export type ScannedIngredient = {
  name: string
  emoji: string
  category: string      // Swedish display label e.g. "Mejeri & Ägg"
  dbCategory: string    // DB value e.g. "dairy"
  location: 'fridge' | 'pantry'
  estimated_quantity: number
  unit: string
  expiry_date: string | null
  selected: boolean
}
