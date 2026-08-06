"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Target, Zap, Scale, Ruler, Weight, Leaf } from "lucide-react"

export type BodyType = 'ectomorph' | 'mesomorph' | 'endomorph'
export type GoalType = 'fat-loss' | 'muscle-gain' | 'maintenance'
export type FoodPreference = 'non-veg' | 'veg' | 'vegan' | 'jain'

interface GoalSettingsProps {
  profile: {
    weight: number
    height: number
    bodyType: BodyType
    goal: GoalType
    foodPreference?: FoodPreference
  }
  setProfile: (profile: any) => void
  onClose: () => void
  onSave: (profile: any, goals: any) => Promise<void>
}

export function GoalSettings({ profile, setProfile, onClose, onSave }: GoalSettingsProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [calculatedGoals, setCalculatedGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 65,
    water: 3000
  })

  // Calculate goals based on profile
  useEffect(() => {
    const { weight, height, bodyType, goal } = profile
    
    if (!weight || !height) return

    // Calculate BMR using Mifflin-St Jeor Equation (assuming male for simplicity)
    const bmr = 10 * weight + 6.25 * height - 5 * 25 + 5 // Assuming age 25
    
    // Activity multiplier (moderate activity)
    const tdee = bmr * 1.55
    
    // Adjust based on goal
    let calories = tdee
    if (goal === 'muscle-gain') {
      calories = tdee + 300 // Surplus for muscle gain
    } else if (goal === 'fat-loss') {
      calories = tdee - 500 // Deficit for fat loss
    }
    
    // Calculate macros based on goal and body type
    let proteinPerKg = 2.0 // Default
    let carbsPercent = 0.40 // 40% of calories
    let fatsPercent = 0.30 // 30% of calories
    
    if (goal === 'muscle-gain') {
      proteinPerKg = 2.2
      carbsPercent = 0.45
      fatsPercent = 0.25
    } else if (goal === 'fat-loss') {
      proteinPerKg = 2.4
      carbsPercent = 0.30
      fatsPercent = 0.35
    }
    
    // Adjust for body type
    if (bodyType === 'ectomorph') {
      carbsPercent += 0.05
      fatsPercent -= 0.05
    } else if (bodyType === 'endomorph') {
      carbsPercent -= 0.05
      fatsPercent += 0.05
    }
    
    const protein = Math.round(weight * proteinPerKg)
    const carbs = Math.round((calories * carbsPercent) / 4) // 4 cal per gram
    const fats = Math.round((calories * fatsPercent) / 9) // 9 cal per gram
    const water = Math.round(weight * 35) // 35ml per kg body weight
    
    setCalculatedGoals({
      calories: Math.round(calories),
      protein,
      carbs,
      fats,
      water
    })
  }, [profile])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(profile, calculatedGoals)
      onClose()
    } catch (error) {
      console.error('Failed to save goals:', error)
      alert('Failed to save goals. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
      <Card className="w-full max-w-md p-0 shadow-2xl border-border bg-card overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20 flex-shrink-0">
            <div>
                <h2 className="text-lg font-bold text-foreground">Settings</h2>
                <p className="text-xs text-muted-foreground">Configure your profile & targets</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Physical Stats */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Scale className="w-3 h-3"/> Physical Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-2">
                    <Weight className="w-3 h-3"/> Weight (kg)
                </label>
                <Input 
                  type="number" 
                  value={profile.weight}
                  onChange={e => setProfile({...profile, weight: Number(e.target.value)})}
                  className="h-10 font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-2">
                    <Ruler className="w-3 h-3"/> Height (cm)
                </label>
                <Input 
                  type="number" 
                  value={profile.height}
                  onChange={e => setProfile({...profile, height: Number(e.target.value)})}
                  className="h-10 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Body Type Selection */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Body Type</h3>
            <div className="grid grid-cols-3 gap-2 p-1 bg-muted/40 rounded-lg border border-border">
              {['ectomorph', 'mesomorph', 'endomorph'].map(type => (
                <button
                  key={type}
                  onClick={() => setProfile({...profile, bodyType: type as BodyType})}
                  className={`py-2 rounded-md text-xs font-medium capitalize transition-all ${
                    profile.bodyType === type 
                    ? 'bg-background shadow-sm border border-border text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Goal Selection */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Objective</h3>
            <div className="space-y-2">
              {[
                {id: 'fat-loss' as GoalType, label: 'Fat Loss', icon: <Target className="w-4 h-4 text-orange-500"/>},
                {id: 'muscle-gain' as GoalType, label: 'Muscle Gain', icon: <Zap className="w-4 h-4 text-red-500"/>},
                {id: 'maintenance' as GoalType, label: 'Maintenance', icon: <Scale className="w-4 h-4 text-blue-500"/>}
              ].map(g => (
                <button
                  key={g.id}
                  onClick={() => setProfile({...profile, goal: g.id})}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                    profile.goal === g.id 
                    ? 'bg-primary/10 border-primary/50 shadow-sm' 
                    : 'bg-transparent border-border hover:bg-muted/40'
                  }`}
                >
                  <span className={`text-sm font-medium ${profile.goal === g.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {g.label}
                  </span>
                  {profile.goal === g.id && g.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Food Preference Selection */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <Leaf className="w-3 h-3"/> Food Preference
            </h3>
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-lg border border-border">
              {[
                {id: 'non-veg' as FoodPreference, label: 'Non-Veg'},
                {id: 'veg' as FoodPreference, label: 'Vegetarian'},
                {id: 'vegan' as FoodPreference, label: 'Vegan'},
                {id: 'jain' as FoodPreference, label: 'Jain'}
              ].map(pref => (
                <button
                  key={pref.id}
                  onClick={() => setProfile({...profile, foodPreference: pref.id})}
                  className={`py-2 rounded-md text-xs font-medium transition-all ${
                    profile.foodPreference === pref.id 
                    ? 'bg-background shadow-sm border border-border text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {pref.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calculated Goals Preview */}
          {profile.weight > 0 && profile.height > 0 && (
            <div className="bg-muted/40 rounded-lg p-4 border border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Calculated Daily Goals</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Calories:</span>
                  <span className="ml-2 font-bold text-foreground">{calculatedGoals.calories}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Protein:</span>
                  <span className="ml-2 font-bold text-foreground">{calculatedGoals.protein}g</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Carbs:</span>
                  <span className="ml-2 font-bold text-foreground">{calculatedGoals.carbs}g</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fats:</span>
                  <span className="ml-2 font-bold text-foreground">{calculatedGoals.fats}g</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Water:</span>
                  <span className="ml-2 font-bold text-foreground">{calculatedGoals.water}ml</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex-shrink-0">
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !profile.weight || !profile.height}
              className="w-full bg-foreground hover:bg-foreground/90 text-background font-semibold h-10"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
      </Card>
    </div>
  )
}