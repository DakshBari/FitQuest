"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Sparkles, Edit3, Loader2 } from "lucide-react"
import { getCurrentTimeForInput, formatInputTimeToDisplay } from "@/lib/timeUtils"
import { getApiUrl } from "@/lib/config"

interface AddMealModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (meal: any) => void
}

type ModeType = 'auto' | 'manual'

export function AddMealModal({ isOpen, onClose, onAdd }: AddMealModalProps) {
    const [mode, setMode] = useState<ModeType>('auto')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    
    // Form State
    const [formData, setFormData] = useState({
        name: "",
        time: "",
        weight: "100",
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
        baseQuantity: "100"
    })

    // Reset form and set current time whenever the modal opens
    useEffect(() => {
        if (isOpen) {
            const currentTime = getCurrentTimeForInput();

            setFormData({
                name: "",
                time: currentTime,
                weight: "100",
                calories: "",
                protein: "",
                carbs: "",
                fats: "",
                baseQuantity: "100"
            })
            setMode('auto')
        }
    }, [isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const analyzeWithGemini = async () => {
        if (!formData.name || !formData.weight) {
            return
        }

        setIsAnalyzing(true)
        try {
            const response = await fetch(`${getApiUrl()}/api/ai-coach/analyze-food`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    foodName: formData.name,
                    weight: Number(formData.weight)
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                const errorMessage = errorData.message || 'Failed to analyze food'
                throw new Error(errorMessage)
            }

            const data = await response.json()
            
            // Update form with AI-generated data
            setFormData(prev => ({
                ...prev,
                calories: data.nutrition.calories.toString(),
                protein: data.nutrition.protein.toString(),
                carbs: data.nutrition.carbs.toString(),
                fats: data.nutrition.fats.toString(),
                baseQuantity: formData.weight
            }))
        } catch (error: any) {
            console.error('Error analyzing food:', error)
            alert(error.message || 'Failed to analyze food. Please try manual mode.')
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        if(!formData.name || !formData.calories) return;

        const newMeal = {
            id: Date.now(),
            name: formData.name,
            time: formatInputTimeToDisplay(formData.time),
            calories: Number(formData.calories),
            protein: Number(formData.protein) || 0,
            carbs: Number(formData.carbs) || 0,
            fats: Number(formData.fats) || 0,
            micros: { fiber: 0, sugar: 0, sodium: 0, cholesterol: 0, vitA: 0, vitC: 0, iron: 0, calcium: 0 },
            isFavorite: false,
            baseQuantity: Number(formData.baseQuantity)
        }

        onAdd(newMeal)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md p-6 border-border bg-background shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-bold text-foreground">Log New Meal</h2>
                    <p className="text-sm text-muted-foreground">Choose auto-analysis or manual entry.</p>
                </div>

                {/* Mode Toggle */}
                <div className="flex gap-2 mb-6 p-1 bg-muted/30 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setMode('auto')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                            mode === 'auto'
                                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        Auto
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('manual')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                            mode === 'manual'
                                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Edit3 className="w-4 h-4" />
                        Manual
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Meal Name</label>
                        <Input 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            placeholder="e.g. Grilled Salmon" 
                            required 
                            autoFocus 
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Time</label>
                        <Input 
                            name="time" 
                            type="time" 
                            value={formData.time}
                            onChange={handleChange}
                        />
                    </div>

                    {mode === 'auto' ? (
                        <>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Weight (grams)</label>
                                <Input 
                                    name="weight" 
                                    type="number" 
                                    value={formData.weight} 
                                    onChange={handleChange} 
                                    placeholder="100"
                                    required
                                />
                            </div>

                            <Button
                                type="button"
                                onClick={analyzeWithGemini}
                                disabled={!formData.name || !formData.weight || isAnalyzing}
                                className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-medium"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Analyze with AI
                                    </>
                                )}
                            </Button>

                            {formData.calories && (
                                <div className="pt-2 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-xs font-semibold text-violet-500 uppercase block mb-2">AI Generated Nutrition</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] text-muted-foreground">Calories</label>
                                            <Input name="calories" type="number" value={formData.calories} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-muted-foreground">Protein (g)</label>
                                            <Input name="protein" type="number" value={formData.protein} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-muted-foreground">Carbs (g)</label>
                                            <Input name="carbs" type="number" value={formData.carbs} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-muted-foreground">Fats (g)</label>
                                            <Input name="fats" type="number" value={formData.fats} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">You can edit these values before adding.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Base Quantity</label>
                                <div className="flex gap-2">
                                    <Input 
                                        name="baseQuantity" 
                                        type="number" 
                                        value={formData.baseQuantity} 
                                        onChange={handleChange} 
                                    />
                                    <span className="flex items-center text-sm text-muted-foreground">g / svc</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-border/50">
                                <label className="text-xs font-semibold text-primary uppercase block mb-2">Nutrition (per quantity)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-muted-foreground">Calories</label>
                                        <Input name="calories" type="number" value={formData.calories} onChange={handleChange} placeholder="0" required />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-muted-foreground">Protein (g)</label>
                                        <Input name="protein" type="number" value={formData.protein} onChange={handleChange} placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-muted-foreground">Carbs (g)</label>
                                        <Input name="carbs" type="number" value={formData.carbs} onChange={handleChange} placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-muted-foreground">Fats (g)</label>
                                        <Input name="fats" type="number" value={formData.fats} onChange={handleChange} placeholder="0" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button 
                            type="submit" 
                            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-medium"
                            disabled={!formData.calories}
                        >
                            Add Meal
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}