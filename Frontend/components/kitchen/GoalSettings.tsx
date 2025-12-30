"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Target, Zap, Scale, Ruler, Weight } from "lucide-react"

export type BodyType = 'ectomorph' | 'mesomorph' | 'endomorph'
export type GoalType = 'fat-loss' | 'muscle-gain' | 'maintenance'

interface GoalSettingsProps {
  profile: {
    weight: number
    height: number
    bodyType: BodyType
    goal: GoalType
  }
  setProfile: (profile: any) => void
  onClose: () => void
}

export function GoalSettings({ profile, setProfile, onClose }: GoalSettingsProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md p-0 shadow-2xl border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
            <div>
                <h2 className="text-lg font-bold text-foreground">Settings</h2>
                <p className="text-xs text-muted-foreground">Configure your profile & targets</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="p-6 space-y-8">
          {/* Physical Stats */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Scale className="w-3 h-3"/> Physical Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-2">
                    <Weight className="w-3 h-3"/> Weight
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
                    <Ruler className="w-3 h-3"/> Height
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
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20">
            <Button onClick={onClose} className="w-full bg-foreground hover:bg-foreground/90 text-background font-semibold h-10">
                Save Changes
            </Button>
        </div>
      </Card>
    </div>
  )
}