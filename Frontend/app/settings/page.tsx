"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { User, Bell, Shield, Palette, Dumbbell } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <h1 className="text-3xl font-bold text-foreground font-orbitron">Settings</h1>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Settings */}
        <Card className="bg-card/80 border-primary/20 backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground font-orbitron">Profile</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">
                  Username
                </Label>
                <Input id="username" defaultValue="WarriorX" className="bg-muted border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="warrior@fitquest.com"
                  className="bg-muted border-border text-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-foreground">
                Bio
              </Label>
              <Input
                id="bio"
                defaultValue="On a quest to become the ultimate warrior"
                className="bg-muted border-border text-foreground"
              />
            </div>
          </div>
        </Card>

        {/* Fitness Goals */}
        <Card className="bg-card/80 border-primary/20 backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Dumbbell className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground font-orbitron">Fitness Goals</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daily-calories" className="text-foreground">
                  Daily Calories
                </Label>
                <Input
                  id="daily-calories"
                  type="number"
                  defaultValue="2400"
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein" className="text-foreground">
                  Protein (g)
                </Label>
                <Input
                  id="protein"
                  type="number"
                  defaultValue="130"
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workout-days" className="text-foreground">
                  Workout Days/Week
                </Label>
                <Input
                  id="workout-days"
                  type="number"
                  defaultValue="5"
                  className="bg-muted border-border text-foreground"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="bg-card/80 border-primary/20 backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground font-orbitron">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-foreground font-medium">Quest Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified about daily quests</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-foreground font-medium">Friend Challenges</p>
                <p className="text-sm text-muted-foreground">Alerts when friends challenge you</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-foreground font-medium">Recovery Alerts</p>
                <p className="text-sm text-muted-foreground">Warnings about overtraining</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-foreground font-medium">Raid Boss Updates</p>
                <p className="text-sm text-muted-foreground">Global event notifications</p>
              </div>
              <Switch />
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card className="bg-card/80 border-primary/20 backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground font-orbitron">Appearance</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-foreground font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Use dark theme</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-foreground font-medium">Reduced Motion</p>
                <p className="text-sm text-muted-foreground">Minimize animations</p>
              </div>
              <Switch />
            </div>
          </div>
        </Card>

        {/* Privacy */}
        <Card className="bg-card/80 border-primary/20 backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground font-orbitron">Privacy & Security</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-foreground font-medium">Profile Visibility</p>
                <p className="text-sm text-muted-foreground">Show profile to other users</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-foreground font-medium">Activity Status</p>
                <p className="text-sm text-muted-foreground">Show when you're online</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-foreground">
                Change Password
              </Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Current password"
                className="bg-muted border-border text-foreground mb-2"
              />
              <Input
                id="new-password"
                type="password"
                placeholder="New password"
                className="bg-muted border-border text-foreground"
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" className="border-border text-foreground hover:bg-accent bg-transparent">
            Cancel
          </Button>
          <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold px-8">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
