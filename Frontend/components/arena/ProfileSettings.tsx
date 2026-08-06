"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Scale, Ruler, Weight, User, Dumbbell } from "lucide-react"

export type BodyType = 'ectomorph' | 'mesomorph' | 'endomorph'
export type WorkoutSplit = 'push-pull-legs' | 'upper-lower' | 'full-body' | 'bro-split' | 'custom'

interface ProfileSettingsProps {
  profile: {
    weight: number
    height: number
    bodyType: BodyType
    workoutSplit?: WorkoutSplit
  }
  setProfile: (profile: any) => void
  onClose: () => void
  onSave: (profile: any) => Promise<void>
}

export function ProfileSettings({ profile, setProfile, onClose, onSave }: ProfileSettingsProps) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(profile)
      onClose()
    } catch (error) {
      console.error('Failed to save profile:', error)
      alert('Failed to save profile. Please try again.')
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
                <h2 className="text-lg font-bold text-foreground">Profile Settings</h2>
                <p className="text-xs text-muted-foreground">Configure your physical stats & training</p>
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
                  placeholder="75"
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
                  placeholder="180"
                />
              </div>
            </div>
          </div>

          {/* Body Type Selection */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <User className="w-3 h-3"/> Body Type
            </h3>
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

          {/* Workout Split Selection */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <Dumbbell className="w-3 h-3"/> Workout Split
            </h3>
            <div className="space-y-2">
              {[
                { id: 'push-pull-legs' as WorkoutSplit, label: 'Push Pull Legs', desc: '3-6 days/week' },
                { id: 'upper-lower' as WorkoutSplit, label: 'Upper Lower', desc: '4 days/week' },
                { id: 'full-body' as WorkoutSplit, label: 'Full Body', desc: '3 days/week' },
                { id: 'bro-split' as WorkoutSplit, label: 'Bro Split', desc: '5-6 days/week' },
                { id: 'custom' as WorkoutSplit, label: 'Custom', desc: 'Your own routine' }
              ].map(split => (
                <button
                  key={split.id}
                  onClick={() => setProfile({...profile, workoutSplit: split.id})}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                    profile.workoutSplit === split.id 
                    ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/50 shadow-sm' 
                    : 'bg-transparent border-border hover:bg-muted/40'
                  }`}
                >
                  <div>
                    <span className={`text-sm font-medium block ${profile.workoutSplit === split.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {split.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{split.desc}</span>
                  </div>
                  {profile.workoutSplit === split.id && (
                    <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Info Card */}
          {profile.weight > 0 && profile.height > 0 && (
            <div className="bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent rounded-lg p-4 border border-violet-500/20">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Your Stats</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="ml-2 font-bold text-foreground">{profile.weight} kg</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Height:</span>
                  <span className="ml-2 font-bold text-foreground">{profile.height} cm</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Body Type:</span>
                  <span className="ml-2 font-bold text-foreground capitalize">{profile.bodyType}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">BMI:</span>
                  <span className="ml-2 font-bold text-foreground">
                    {((profile.weight / ((profile.height / 100) ** 2))).toFixed(1)}
                  </span>
                </div>
                {profile.workoutSplit && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Split:</span>
                    <span className="ml-2 font-bold text-foreground capitalize">
                      {profile.workoutSplit.replace(/-/g, ' ')}
                    </span>
                  </div>
                )}
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
