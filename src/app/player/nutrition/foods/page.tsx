"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

interface Food {
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  portion: string;
  note: string;
  zim: boolean; // Zimbabwe-specific
}

const FOODS: Food[] = [
  // Staples
  { name: "Sadza (white maize)", category: "Staples", calories: 320, protein: 7, carbs: 68, fat: 2, fiber: 3, portion: "1 cup cooked (200g)", note: "Zimbabwe's staple carbohydrate", zim: true },
  { name: "Sadza (sorghum)", category: "Staples", calories: 290, protein: 9, carbs: 60, fat: 3, fiber: 5, portion: "1 cup cooked (200g)", note: "Higher iron than maize sadza", zim: true },
  { name: "Sweet potato", category: "Staples", calories: 180, protein: 3, carbs: 42, fat: 0, fiber: 4, portion: "1 medium (180g)", note: "Excellent for pre-training fuel", zim: true },
  { name: "Rice (white)", category: "Staples", calories: 240, protein: 5, carbs: 53, fat: 0, fiber: 1, portion: "1 cup cooked (180g)", note: "Easy to digest", zim: false },

  // Proteins
  { name: "Matemba (dried kapenta)", category: "Protein", calories: 180, protein: 38, carbs: 0, fat: 4, fiber: 0, portion: "50g serving", note: "High protein, calcium, iron. Superstar food!", zim: true },
  { name: "Nyama (beef)", category: "Protein", calories: 220, protein: 28, carbs: 0, fat: 11, fiber: 0, portion: "100g lean", note: "Grass-fed Zimbabwean beef is excellent quality", zim: true },
  { name: "Chicken breast", category: "Protein", calories: 165, protein: 31, carbs: 0, fat: 4, fiber: 0, portion: "100g cooked", note: "Lean protein for muscle recovery", zim: false },
  { name: "Fish (Bream/Tilapia)", category: "Protein", calories: 145, protein: 26, carbs: 0, fat: 4, fiber: 0, portion: "100g fillet", note: "From Kariba/Cahora Bassa. High omega-3", zim: true },
  { name: "Boiled eggs", category: "Protein", calories: 155, protein: 13, carbs: 1, fat: 11, fiber: 0, portion: "2 large eggs", note: "Complete protein source", zim: false },
  { name: "Groundnuts (peanuts)", category: "Protein", calories: 280, protein: 14, carbs: 8, fat: 23, fiber: 4, portion: "50g (handful)", note: "High energy snack, great for endurance", zim: true },

  // Vegetables
  { name: "Muriwo (rape/collards)", category: "Vegetables", calories: 35, protein: 3, carbs: 5, fat: 0, fiber: 3, portion: "1 cup cooked (120g)", note: "High iron and calcium. Eat daily!", zim: true },
  { name: "Covo (kale)", category: "Vegetables", calories: 32, protein: 3, carbs: 4, fat: 0, fiber: 3, portion: "1 cup cooked (120g)", note: "Even more nutrient-dense than muriwo", zim: true },
  { name: "Tomatoes", category: "Vegetables", calories: 22, protein: 1, carbs: 5, fat: 0, fiber: 1, portion: "1 medium (120g)", note: "Lycopene for recovery", zim: false },
  { name: "Butternut squash", category: "Vegetables", calories: 68, protein: 2, carbs: 15, fat: 0, fiber: 2, portion: "1 cup cubed (150g)", note: "Vitamin A for vision and immunity", zim: true },

  // Fruits
  { name: "Mango", category: "Fruits", calories: 99, protein: 1, carbs: 25, fat: 0, fiber: 3, portion: "1 medium (200g)", note: "Vitamin C + quick carbs pre-match", zim: true },
  { name: "Banana", category: "Fruits", calories: 89, protein: 1, carbs: 23, fat: 0, fiber: 3, portion: "1 medium (118g)", note: "Potassium prevents cramps", zim: false },
  { name: "Guava", category: "Fruits", calories: 68, protein: 3, carbs: 14, fat: 1, fiber: 5, portion: "1 medium (165g)", note: "Highest vitamin C fruit available locally", zim: true },
  { name: "Papaya", category: "Fruits", calories: 59, protein: 1, carbs: 15, fat: 0, fiber: 2, portion: "1 cup cubed (145g)", note: "Anti-inflammatory, aids digestion", zim: true },

  // Dairy/Fats
  { name: "Full cream milk", category: "Dairy", calories: 149, protein: 8, carbs: 12, fat: 8, fiber: 0, portion: "1 cup (240ml)", note: "Best post-training recovery drink", zim: false },
  { name: "Maheu", category: "Dairy", calories: 165, protein: 5, carbs: 32, fat: 2, fiber: 1, portion: "1 cup (250ml)", note: "Fermented maize drink — probiotics + carbs", zim: true },
];

const CATEGORIES = ["All", "Staples", "Protein", "Vegetables", "Fruits", "Dairy"];

export default function FoodBrowserPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<Food | null>(null);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
  }, [user, router]);

  const filtered = FOODS.filter((f) => {
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || f.category === category;
    return matchSearch && matchCat;
  });

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player/nutrition" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Food Browser</h1>
            <p className="text-sm text-muted-foreground">Zimbabwe athlete food database</p>
          </div>
        </div>

        <div className="mb-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search foods…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                category === c ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"
              }`}>{c}</button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((food) => (
            <button key={food.name} onClick={() => setSelected(food === selected ? null : food)}
              className={`rounded-xl border p-4 text-left transition-all hover:border-primary/40 ${selected?.name === food.name ? "border-primary bg-primary/5" : "bg-card"}`}>
              <div className="mb-2 flex items-start justify-between">
                <p className="font-semibold text-sm">{food.name}
                  {food.zim && <span className="ml-1.5 text-xs">🇿🇼</span>}
                </p>
                <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-bold text-orange-600">{food.calories} kcal</span>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">{food.portion}</p>
              <div className="flex gap-3 text-xs">
                <span className="text-blue-600 font-medium">{food.protein}g protein</span>
                <span className="text-green-600 font-medium">{food.carbs}g carbs</span>
                <span className="text-yellow-600 font-medium">{food.fat}g fat</span>
              </div>
              {selected?.name === food.name && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs text-muted-foreground">{food.note}</p>
                  <div className="mt-2 flex gap-2 text-xs">
                    <span className="rounded bg-muted px-2 py-0.5">Fiber: {food.fiber}g</span>
                    <span className="rounded bg-muted px-2 py-0.5">{food.category}</span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
