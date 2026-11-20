/*
  The 21 category codes the backend (AI receipt scan) returns,
  each with a readable English name and an icon.
*/
import type { Component } from 'vue'
import {
  Apple, Archive, Beef, Carrot, Cookie, Croissant, CupSoda, Cylinder, Drumstick, Egg,
  Fish, Ham, Leaf, Milk, Package, Snowflake, Soup, Sprout, Wheat,
} from '@lucide/vue'

export interface CategoryInfo {
  label: string
  icon: Component
}

export const categories: Record<string, CategoryInfo> = {
  fresh_milk: { label: 'Fresh milk', icon: Milk },
  dairy: { label: 'Dairy', icon: Milk },
  cheese: { label: 'Cheese', icon: Cylinder },
  eggs: { label: 'Eggs', icon: Egg },
  minced_meat: { label: 'Minced meat', icon: Beef },
  meat: { label: 'Meat', icon: Drumstick },
  cold_cuts: { label: 'Cold cuts', icon: Ham },
  fish: { label: 'Fish', icon: Fish },
  fruit: { label: 'Fruit', icon: Apple },
  vegetables: { label: 'Vegetables', icon: Carrot },
  leafy_greens: { label: 'Leafy greens', icon: Leaf },
  bakery: { label: 'Bakery', icon: Croissant },
  ready_meals: { label: 'Ready meals', icon: Soup },
  plant_based: { label: 'Plant based', icon: Sprout },
  frozen: { label: 'Frozen', icon: Snowflake },
  dry_goods: { label: 'Dry goods', icon: Wheat },
  canned: { label: 'Canned food', icon: Archive },
  condiments: { label: 'Condiments', icon: Package },
  snacks: { label: 'Snacks', icon: Cookie },
  beverages: { label: 'Beverages', icon: CupSoda },
  other: { label: 'Other', icon: Package },
}

export function categoryOf(code: string): CategoryInfo {
  return categories[code] ?? categories.other
}

