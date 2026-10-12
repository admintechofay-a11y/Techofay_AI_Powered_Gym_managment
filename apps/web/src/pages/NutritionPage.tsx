import React, { useState, useEffect } from 'react';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';
import {
  Apple,
  Calculator,
  Database,
  Calendar,
  Droplets,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Flame,
  Award,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  FileCheck,
} from 'lucide-react';

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  servingSize: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
}

export interface DietPlanItem {
  id: string;
  memberName: string;
  memberCode: string;
  title: string;
  dailyCalorieTarget: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  waterIntakeLiters: number;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  approvedByNutritionistName?: string;
  meals: {
    mealName: string;
    time: string;
    foods: { foodName: string; quantity: string; calories: number; protein: number; carbs: number; fats: number }[];
  }[];
}

const INITIAL_DIET_PLANS: DietPlanItem[] = [];

export const NutritionPage: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'CALCULATOR' | 'FOODS' | 'PLANS' | 'WATER'>('CALCULATOR');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [plans, setPlans] = useState<DietPlanItem[]>(INITIAL_DIET_PLANS);

  // Search & Filters
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCategory, setFoodCategory] = useState('ALL');

  // Calculator Form State (Mifflin-St Jeor formula)
  const [calcForm, setCalcForm] = useState({
    gender: 'MALE' as 'MALE' | 'FEMALE',
    age: 30,
    weightKg: 78,
    heightCm: 178,
    activityLevel: 'MODERATE' as 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE',
    goal: 'FAT_LOSS' as 'FAT_LOSS' | 'MAINTENANCE' | 'MUSCLE_GAIN',
  });

  // Water intake state
  const [waterLoggedLiters, setWaterLoggedLiters] = useState(0);
  const waterTargetLiters = 3.5;

  // Review Modal State
  const [selectedPlanForReview, setSelectedPlanForReview] = useState<DietPlanItem | null>(null);
  const [reviewNotesInput, setReviewNotesInput] = useState('');

  // Fetch real foods from API on mount
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await api.get('/nutrition/foods');
        if (res.success && res.data?.foods && res.data.foods.length > 0) {
          setFoods(res.data.foods);
        }
      } catch {
        // Fallback
      }
    };
    fetchFoods();
  }, []);

  // Scientific Mifflin-St Jeor calculation
  const calculateTargets = () => {
    let bmr = 10 * calcForm.weightKg + 6.25 * calcForm.heightCm - 5 * calcForm.age;
    bmr = calcForm.gender === 'MALE' ? bmr + 5 : bmr - 161;

    const multipliers: Record<string, number> = {
      SEDENTARY: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      VERY_ACTIVE: 1.725,
      EXTRA_ACTIVE: 1.9,
    };
    const tdee = Math.round(bmr * (multipliers[calcForm.activityLevel] || 1.55));

    let targetCalories = tdee;
    if (calcForm.goal === 'FAT_LOSS') targetCalories = Math.round(tdee - 500);
    else if (calcForm.goal === 'MUSCLE_GAIN') targetCalories = Math.round(tdee + 350);

    targetCalories = Math.max(1200, targetCalories);

    const proteinGrams = Math.round(calcForm.weightKg * 2.0);
    const fatCalories = targetCalories * 0.25;
    const fatsGrams = Math.round(fatCalories / 9);
    const carbCalories = Math.max(0, targetCalories - (proteinGrams * 4 + fatCalories));
    const carbsGrams = Math.round(carbCalories / 4);
    const waterLiters = parseFloat(((calcForm.weightKg * 38) / 1000).toFixed(1));

    return {
      bmr: Math.round(bmr),
      tdee,
      targetCalories,
      proteinGrams,
      carbsGrams,
      fatsGrams,
      waterLiters: Math.max(2.5, waterLiters),
    };
  };

  const calculated = calculateTargets();

  // Filtered Food Database
  const filteredFoods = foods.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(foodSearch.toLowerCase());
    const matchesCat = foodCategory === 'ALL' || f.category === foodCategory;
    return matchesSearch && matchesCat;
  });

  // Handle Nutritionist Review Action
  const handleApprovePlan = (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedPlanForReview) return;

    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === selectedPlanForReview.id) {
          return {
            ...p,
            status,
            reviewNotes: reviewNotesInput || (status === 'APPROVED' ? 'Approved by Nutritionist' : 'Rejected for revisions'),
            approvedByNutritionistName: status === 'APPROVED' ? 'Dr. Riya Sen (RD, Sports Nutrition)' : undefined,
          };
        }
        return p;
      }),
    );

    setSelectedPlanForReview(null);
    setReviewNotesInput('');

    addToast({
      title: status === 'APPROVED' ? 'Diet Plan Approved!' : 'Diet Plan Rejected',
      message: `Updated approval status for ${selectedPlanForReview.memberName}`,
      type: status === 'APPROVED' ? 'success' : 'info',
    });
  };

  // Water log quick addition
  const addWater = (amountL: number) => {
    const newTotal = parseFloat((waterLoggedLiters + amountL).toFixed(2));
    setWaterLoggedLiters(newTotal);
    addToast({
      title: 'Water Logged',
      message: `Added +${amountL * 1000} ml. Daily total: ${newTotal} Liters.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/60 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <Apple className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nutrition & Macro Engine</h1>
            <p className="text-sm text-muted-foreground">
              Mifflin-St Jeor calculator, 300+ Indian food database, meal schedules & nutritionist approval flow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('CALCULATOR')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'CALCULATOR'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              BMR Calculator
            </button>
            <button
              onClick={() => setActiveTab('FOODS')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'FOODS'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Indian Foods (300+)
            </button>
            <button
              onClick={() => setActiveTab('PLANS')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'PLANS'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              Diet Plans
            </button>
            <button
              onClick={() => setActiveTab('WATER')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'WATER'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              Water Tracking
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: BMR & MACRO CALCULATOR */}
      {activeTab === 'CALCULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-5 bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Mifflin-St Jeor Energy Inputs
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Gender"
                value={calcForm.gender}
                onChange={(e) => setCalcForm({ ...calcForm, gender: e.target.value as any })}
                options={[
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                ]}
              />
              <Input
                label="Age (years)"
                type="number"
                value={calcForm.age}
                onChange={(e) => setCalcForm({ ...calcForm, age: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Weight (kg)"
                type="number"
                value={calcForm.weightKg}
                onChange={(e) => setCalcForm({ ...calcForm, weightKg: Number(e.target.value) })}
              />
              <Input
                label="Height (cm)"
                type="number"
                value={calcForm.heightCm}
                onChange={(e) => setCalcForm({ ...calcForm, heightCm: Number(e.target.value) })}
              />
            </div>

            <Select
              label="Activity Level"
              value={calcForm.activityLevel}
              onChange={(e) => setCalcForm({ ...calcForm, activityLevel: e.target.value as any })}
              options={[
                { value: 'SEDENTARY', label: 'Sedentary (Desk job, no exercise)' },
                { value: 'LIGHT', label: 'Light Activity (1-3 days/week)' },
                { value: 'MODERATE', label: 'Moderate Activity (3-5 days/week)' },
                { value: 'VERY_ACTIVE', label: 'Very Active (6-7 days intense)' },
                { value: 'EXTRA_ACTIVE', label: 'Extra Active (Athlete / 2x a day)' },
              ]}
            />

            <Select
              label="Fitness Objective"
              value={calcForm.goal}
              onChange={(e) => setCalcForm({ ...calcForm, goal: e.target.value as any })}
              options={[
                { value: 'FAT_LOSS', label: 'Fat Loss (500 kcal Deficit)' },
                { value: 'MAINTENANCE', label: 'Maintenance (Equal TDEE)' },
                { value: 'MUSCLE_GAIN', label: 'Muscle Gain (350 kcal Surplus)' },
              ]}
            />
          </div>

          {/* Scientific Output Metrics */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                <p className="text-xs text-muted-foreground uppercase font-medium">Basal Metabolic Rate</p>
                <h4 className="text-2xl font-bold mt-1 text-foreground">{calculated.bmr} kcal</h4>
                <p className="text-[11px] text-muted-foreground mt-1">Base calories burned at complete rest</p>
              </div>

              <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                <p className="text-xs text-muted-foreground uppercase font-medium">Daily TDEE</p>
                <h4 className="text-2xl font-bold mt-1 text-foreground">{calculated.tdee} kcal</h4>
                <p className="text-[11px] text-muted-foreground mt-1">Total expenditure with activity</p>
              </div>

              <div className="bg-card p-5 rounded-2xl border border-primary/40 shadow-sm bg-primary/5">
                <p className="text-xs text-primary uppercase font-bold">Target Daily Calories</p>
                <h4 className="text-3xl font-bold mt-1 text-primary">{calculated.targetCalories} kcal</h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {calcForm.goal === 'FAT_LOSS' ? '🔥 500 kcal Deficit' : '💪 Hypertrophy Surplus'}
                </p>
              </div>
            </div>

            {/* Target Macronutrient Splits */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <h4 className="font-bold text-base text-foreground flex items-center justify-between">
                <span>Personalized Daily Macro Distribution</span>
                <span className="text-xs text-muted-foreground font-normal">High-Protein Fitness Ratio</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">Protein (2g / kg)</p>
                  <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{calculated.proteinGrams}g</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{calculated.proteinGrams * 4} kcal</p>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase">Carbohydrates</p>
                  <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{calculated.carbsGrams}g</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{calculated.carbsGrams * 4} kcal</p>
                </div>

                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase">Healthy Fats (25%)</p>
                  <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{calculated.fatsGrams}g</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{calculated.fatsGrams * 9} kcal</p>
                </div>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-cyan-500" />
                  Recommended Daily Hydration
                </span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">
                  {calculated.waterLiters} Liters / day
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTHENTIC INDIAN FOOD DATABASE */}
      {activeTab === 'FOODS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-card/40 p-4 rounded-xl border border-border">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Indian foods (e.g. Paneer, Dal, Idli, Roti, Chicken Tikka)..."
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={foodCategory}
              onChange={(e) => setFoodCategory(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Food Categories' },
                { value: 'Dairy & Plant Protein', label: 'Dairy & Plant Protein' },
                { value: 'Dals & Legumes', label: 'Dals & Legumes' },
                { value: 'Breads & Grains', label: 'Breads & Grains' },
                { value: 'Poultry & Seafood', label: 'Poultry & Seafood' },
                { value: 'South Indian Specials', label: 'South Indian Specials' },
                { value: 'Salads & Sprouted Legumes', label: 'Salads & Sprouted Legumes' },
              ]}
            />
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold">Indian Food Items ({filteredFoods.length})</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3">Food Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Serving Size</th>
                    <th className="px-4 py-3">Calories</th>
                    <th className="px-4 py-3">Protein</th>
                    <th className="px-4 py-3">Carbs</th>
                    <th className="px-4 py-3">Fats</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredFoods.map((f) => (
                    <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-foreground">{f.name}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant="outline">{f.category}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">{f.servingSize}</td>
                      <td className="px-4 py-3.5 font-bold text-foreground">{f.calories} kcal</td>
                      <td className="px-4 py-3.5 font-bold text-blue-600 dark:text-blue-400">{f.proteinGrams}g</td>
                      <td className="px-4 py-3.5 text-amber-600 dark:text-amber-400 font-medium">{f.carbsGrams}g</td>
                      <td className="px-4 py-3.5 text-purple-600 dark:text-purple-400 font-medium">{f.fatsGrams}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MEAL SCHEDULES & NUTRITIONIST APPROVAL */}
      {activeTab === 'PLANS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plans.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-card rounded-2xl border border-dashed border-border text-muted-foreground">
              No assigned meal schedules found. Create a plan or use the Macro Calculator.
            </div>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{plan.title}</h3>
                      <p className="text-xs text-muted-foreground">Client: {plan.memberName} ({plan.memberCode})</p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        plan.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : plan.status === 'PENDING_REVIEW'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {plan.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Macro summary pills */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-muted/40 rounded-xl">
                      <p className="text-muted-foreground">Calories</p>
                      <p className="font-bold text-foreground">{plan.dailyCalorieTarget}</p>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                      <p className="opacity-80">Protein</p>
                      <p className="font-bold">{plan.proteinGrams}g</p>
                    </div>
                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
                      <p className="opacity-80">Carbs</p>
                      <p className="font-bold">{plan.carbsGrams}g</p>
                    </div>
                    <div className="p-2 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
                      <p className="opacity-80">Fats</p>
                      <p className="font-bold">{plan.fatsGrams}g</p>
                    </div>
                  </div>

                  {/* Meal Schedules */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Scheduled Meals
                    </h4>
                    {plan.meals.map((m, idx) => (
                      <div key={idx} className="p-3 bg-muted/30 rounded-xl border border-border/50 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-semibold text-foreground">
                          <span>{m.mealName}</span>
                        </div>
                        <div className="space-y-1 text-muted-foreground">
                          {m.foods.map((food, fIdx) => (
                            <div key={fIdx} className="flex justify-between">
                              <span>• {food.foodName} ({food.quantity})</span>
                              <span className="font-mono text-[11px]">{food.calories} kcal ({food.protein}g P)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Review Notes */}
                  {plan.reviewNotes && (
                    <div className="p-3 bg-muted/20 border border-border rounded-xl text-xs space-y-1">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Nutritionist Notes {plan.approvedByNutritionistName ? `by ${plan.approvedByNutritionistName}` : ''}:
                      </p>
                      <p className="text-muted-foreground italic">{plan.reviewNotes}</p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-border flex justify-end gap-2">
                  {plan.status !== 'APPROVED' ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedPlanForReview(plan);
                        setReviewNotesInput(plan.reviewNotes || '');
                      }}
                    >
                      Nutritionist Review
                    </Button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Approved & Active
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: WATER TRACKING */}
      {activeTab === 'WATER' && (
        <div className="max-w-xl mx-auto bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6 text-center">
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-500 mx-auto flex items-center justify-center">
              <Droplets className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Daily Hydration Tracker</h3>
            <p className="text-xs text-muted-foreground">Target: {waterTargetLiters} Liters / day based on bodyweight</p>
          </div>

          {/* Big Progress Gauge */}
          <div className="space-y-2">
            <h2 className="text-4xl font-extrabold text-cyan-600 dark:text-cyan-400">
              {waterLoggedLiters} <span className="text-xl font-normal text-muted-foreground">/ {waterTargetLiters} L</span>
            </h2>
            <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((waterLoggedLiters / waterTargetLiters) * 100))}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((waterLoggedLiters / waterTargetLiters) * 100)}% of daily target reached
            </p>
          </div>

          {/* Quick Log Buttons */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <Button variant="outline" onClick={() => addWater(0.25)} className="text-xs">
              + 250 ml (Glass)
            </Button>
            <Button variant="outline" onClick={() => addWater(0.5)} className="text-xs">
              + 500 ml (Shaker)
            </Button>
            <Button variant="outline" onClick={() => addWater(1.0)} className="text-xs">
              + 1000 ml (Bottle)
            </Button>
          </div>
        </div>
      )}

      {/* MODAL: NUTRITIONIST REVIEW */}
      {selectedPlanForReview && (
        <Modal
          isOpen={Boolean(selectedPlanForReview)}
          onClose={() => setSelectedPlanForReview(null)}
          title={`Nutritionist Review: ${selectedPlanForReview.title}`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Verify macro splits, nutrient adequacy, and calorie balance for {selectedPlanForReview.memberName}.
            </p>
            <Input
              label="Review & Approval Notes"
              placeholder="e.g. Macros verified and balanced for hypertrophic gains..."
              value={reviewNotesInput}
              onChange={(e) => setReviewNotesInput(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="destructive"
                onClick={() => handleApprovePlan('REJECTED')}
              >
                Reject for Revisions
              </Button>
              <Button
                onClick={() => handleApprovePlan('APPROVED')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Approve Diet Plan
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default NutritionPage;
