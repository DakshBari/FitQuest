"use client"

import { useState, useEffect } from "react" // Added useEffect
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"
import { getCurrentTimeForInput, formatInputTimeToDisplay } from "@/lib/timeUtils"

interface AddMealModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (meal: any) => void
}

export function AddMealModal({ isOpen, onClose, onAdd }: AddMealModalProps) {
    // Form State
    const [formData, setFormData] = useState({
        name: "",
        time: "",
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
        baseQuantity: "100"
    })

    // FIX: Reset form and set current time whenever the modal opens
    useEffect(() => {
        if (isOpen) {
            const currentTime = getCurrentTimeForInput();

            setFormData({
                name: "",
                time: currentTime, // Set to current time
                calories: "",
                protein: "",
                carbs: "",
                fats: "",
                baseQuantity: "100"
            })
        }
    }, [isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Basic validation
        if(!formData.name || !formData.calories) return;

        const newMeal = {
            id: Date.now(),
            name: formData.name,
            time: formatInputTimeToDisplay(formData.time), // Convert to consistent 24-hour format
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
                    <p className="text-sm text-muted-foreground">Enter nutritional details manually.</p>
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

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">Add Meal</Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}