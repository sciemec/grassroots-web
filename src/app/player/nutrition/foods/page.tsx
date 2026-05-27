"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";

interface Food {
  id?: string | number;
  name: string;
  name_shona?: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  football_benefit?: string;
  football_benefit_shona?: string;
}

export default function FoodBrowserPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<Food | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/zim_foods.json")
      .then((r) => r.json())
      .then((data: Food[]) => setFoods(data))
      .catch(() => setFoods([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(foods.map((f) => f.category))).sort()];

  const filtered = foods.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      f.name.toLowerCase().includes(q) ||
      (f.name_shona ?? "").toLowerCase().includes(q) ||
      (f.football_benefit ?? "").toLowerCase().includes(q);
    const matchCat = category === "All" || f.category === category;
    return matchSearch && matchCat;
  });

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
            <p className="text-sm text-muted-foreground">
              Zimbabwe athlete food database{!loading && ` · ${foods.length} foods`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading foods…
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, Shona name or benefit…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    category === c ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No foods found. Try a different search.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((food, idx) => {
                  const key = food.id ?? `${food.name}-${idx}`;
                  const isSelected = selected?.name === food.name;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelected(isSelected ? null : food)}
                      className={`rounded-xl border p-4 text-left transition-all hover:border-primary/40 ${isSelected ? "border-primary bg-primary/5" : "bg-card"}`}
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-sm">{food.name} <span className="text-xs">🇿🇼</span></p>
                          {food.name_shona && (
                            <p className="text-xs text-muted-foreground italic">{food.name_shona}</p>
                          )}
                        </div>
                        <span className="flex-shrink-0 rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-bold text-orange-500">
                          {food.calories_per_100g} kcal
                        </span>
                      </div>
                      <p className="mb-2 text-[10px] text-muted-foreground">per 100 g</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="text-blue-400 font-medium">{food.protein_per_100g}g protein</span>
                        <span className="text-green-400 font-medium">{food.carbs_per_100g}g carbs</span>
                        <span className="text-yellow-400 font-medium">{food.fat_per_100g}g fat</span>
                      </div>
                      {isSelected && (
                        <div className="mt-3 border-t pt-3 space-y-2">
                          {food.football_benefit && (
                            <p className="text-xs text-muted-foreground">⚽ {food.football_benefit}</p>
                          )}
                          {food.football_benefit_shona && (
                            <p className="text-xs text-muted-foreground/70 italic">🗣 {food.football_benefit_shona}</p>
                          )}
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="rounded bg-muted px-2 py-0.5">Fiber: {food.fiber_per_100g}g</span>
                            <span className="rounded bg-muted px-2 py-0.5">{food.category}</span>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
