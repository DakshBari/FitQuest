"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { User, Shield, Dumbbell, Sparkles, Lock, Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getUserProfile, updateUserProfile, changePassword, type UserProfile } from "@/services/userService"
import { ProtectedLayout } from "@/components/layouts/ProtectedLayout"
import { PageHeader } from "@/components/page-header"

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Profile fields
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [weight, setWeight] = useState("")
  const [height, setHeight] = useState("")
  const [bodyType, setBodyType] = useState<"ectomorph" | "mesomorph" | "endomorph" | "">("")
  const [goal, setGoal] = useState<"muscle-gain" | "weight-loss" | "maintenance" | "endurance" | "">("")
  const [workoutSplit, setWorkoutSplit] = useState<"push-pull-legs" | "upper-lower" | "full-body" | "bro-split" | "custom" | "">("")
  const [foodPreference, setFoodPreference] = useState<"non-veg" | "veg" | "vegan" | "jain" | "">("")

  // Goals fields
  const [calories, setCalories] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")
  const [fats, setFats] = useState("")
  const [water, setWater] = useState("")

  // Privacy fields
  const [profileVisible, setProfileVisible] = useState(true)
  const [activityVisible, setActivityVisible] = useState(true)

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await getUserProfile()
      
      setUsername(data.username || "")
      setEmail(data.email || "")
      setWeight(data.profile?.weight?.toString() || "")
      setHeight(data.profile?.height?.toString() || "")
      setBodyType(data.profile?.bodyType || "")
      setGoal(data.profile?.goal || "")
      setWorkoutSplit(data.profile?.workoutSplit || "")
      setFoodPreference(data.profile?.foodPreference || "")

      setCalories(data.goals?.calories?.toString() || "2000")
      setProtein(data.goals?.protein?.toString() || "150")
      setCarbs(data.goals?.carbs?.toString() || "200")
      setFats(data.goals?.fats?.toString() || "65")
      setWater(data.goals?.water?.toString() || "3000")

      // Fallbacks for privacy model if it doesn't exist
      setProfileVisible(data.privacy?.profileVisible ?? true)
      setActivityVisible(data.privacy?.activityVisible ?? true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load settings.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      
      const payload: any = {
        username,
        email,
        profile: {
          weight: weight ? parseFloat(weight) : undefined,
          height: height ? parseFloat(height) : undefined,
          bodyType: bodyType || undefined,
          goal: goal || undefined,
          workoutSplit: workoutSplit || undefined,
          foodPreference: foodPreference || undefined,
        },
        goals: {
          calories: calories ? parseInt(calories) : undefined,
          protein: protein ? parseFloat(protein) : undefined,
          carbs: carbs ? parseFloat(carbs) : undefined,
          fats: fats ? parseFloat(fats) : undefined,
          water: water ? parseInt(water) : undefined,
        },
        privacy: {
          profileVisible,
          activityVisible,
        }
      }

      await updateUserProfile(payload)
      
      toast({
        title: "Settings Updated",
        description: "Your profile settings have been successfully saved.",
      })
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Could not update settings. Check for duplicate usernames/emails.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill out all password fields.",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "New password must be at least 6 characters.",
        variant: "destructive",
      })
      return
    }

    try {
      setPasswordSaving(true)
      const msg = await changePassword(currentPassword, newPassword)
      toast({
        title: "Success",
        description: msg || "Password changed successfully.",
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error.message || "Incorrect current password.",
        variant: "destructive",
      })
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 text-[#7F22FE] animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your settings...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen flex flex-col bg-background">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 flex-1 flex flex-col pt-4 pb-8 space-y-6">
          <PageHeader 
            className="px-0"
            title="Settings"
            subtitle="Configure your FitQuest experience and physical targets"
          />

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-7 space-y-6">
              {/* Profile Card */}
              <Card className="bg-card/70 border-border/50 backdrop-blur-xl p-6 rounded-3xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-[#7F22FE]/10 border border-[#7F22FE]/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-[#7F22FE]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Profile Information</h2>
                    <p className="text-[10px] text-muted-foreground/50">Manage your identity details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-xs text-muted-foreground/75 font-semibold">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      className="bg-muted/10 border-border/50 text-foreground h-9 rounded-xl text-xs placeholder:text-muted-foreground/30 focus:ring-[#7F22FE]/40"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs text-muted-foreground/75 font-semibold">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="bg-muted/10 border-border/50 text-foreground h-9 rounded-xl text-xs placeholder:text-muted-foreground/30 focus:ring-[#7F22FE]/40"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="weight" className="text-xs text-muted-foreground/75 font-semibold">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g. 72.5"
                      className="bg-muted/10 border-border/50 text-foreground h-9 rounded-xl text-xs placeholder:text-muted-foreground/30 focus:ring-[#7F22FE]/40"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="height" className="text-xs text-muted-foreground/75 font-semibold">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g. 178"
                      className="bg-muted/10 border-border/50 text-foreground h-9 rounded-xl text-xs placeholder:text-muted-foreground/30 focus:ring-[#7F22FE]/40"
                    />
                  </div>
                </div>
              </Card>

              {/* Goals Card */}
              <Card className="bg-card/70 border-border/50 backdrop-blur-xl p-6 rounded-3xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-[#7F22FE]/10 border border-[#7F22FE]/20 flex items-center justify-center">
                    <Dumbbell className="h-4 w-4 text-[#7F22FE]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Daily Nutrition Goals</h2>
                    <p className="text-[10px] text-muted-foreground/50">Target daily intake metrics</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  <div className="space-y-1.5">
                    <Label htmlFor="calories" className="text-xs text-muted-foreground/75 font-semibold">Calories (kcal)</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      placeholder="2000"
                      className="bg-muted/10 border-border/50 text-foreground h-9 rounded-xl text-xs placeholder:text-muted-foreground/30 focus:ring-[#7F22FE]/40"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="protein" className="text-xs text-muted-foreground/75 font-semibold">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      placeholder="150"
                      className="bg-muted/10 border-border/50 text-foreground h-9 rounded-xl text-xs placeholder:text-muted-foreground/30 focus:ring-[#7F22FE]/40"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="carbs" className="text-xs text-muted-foreground/75 font-semibold">Carbs (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      placeholder="200"
                      className="bg-muted/10 border-border/50 text-foreground h-9 rounded-xl text-xs placeholder:text-muted-foreground/30 focus:ring-[#7F22FE]/40"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fats" className="text-xs text-muted-foreground/75 font-semibold">Fats (g)</Label>
                    <Input
                      id="fats"
                      type="number"
                      value={fats}
                      onChange={(e) => setFats(e.target.value)}
                      placeholder="65"
                      className="bg-muted/10 border-border/50 text-foreground h-9 rounded-xl text-xs placeholder:text-muted-foreground/30 focus:ring-[#7F22FE]/40"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="water" className="text-xs text-muted-foreground/75 font-semibold">Water (ml)</Label>
                    <Input
                      id="water"
                      type="number"
                      value={water}
                      onChange={(e) => setWater(e.target.value)}
                      placeholder="3000"
                      className="bg-muted/10 border-border/50 text-foreground h-9 rounded-xl text-xs placeholder:text-muted-foreground/30 focus:ring-[#7F22FE]/40"
                      required
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Secondary Settings */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20 lg:self-start">
              {/* Preferences Card */}
              <Card className="bg-card/70 border-border/50 backdrop-blur-xl p-6 rounded-3xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-[#7F22FE]/10 border border-[#7F22FE]/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-[#7F22FE]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Fitness Preferences</h2>
                    <p className="text-[10px] text-muted-foreground/50">Personalize training & dietary choices</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  <div className="space-y-1.5">
                    <Label htmlFor="bodyType" className="text-xs text-muted-foreground/75 font-semibold">Body Type</Label>
                    <select
                      id="bodyType"
                      value={bodyType}
                      onChange={(e: any) => setBodyType(e.target.value)}
                      className="w-full h-9 rounded-xl border border-border/50 bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7F22FE]/40 focus:border-[#7F22FE]/40 transition-colors"
                    >
                      <option value="">Select body type</option>
                      <option value="ectomorph">Ectomorph (Lean/High metabolism)</option>
                      <option value="mesomorph">Mesomorph (Athletic/Muscle-prone)</option>
                      <option value="endomorph">Endomorph (Soft/Strong/Slow metabolism)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="goal" className="text-xs text-muted-foreground/75 font-semibold">Fitness Goal</Label>
                    <select
                      id="goal"
                      value={goal}
                      onChange={(e: any) => setGoal(e.target.value)}
                      className="w-full h-9 rounded-xl border border-border/50 bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7F22FE]/40 focus:border-[#7F22FE]/40 transition-colors"
                    >
                      <option value="">Select primary goal</option>
                      <option value="muscle-gain">Muscle Gain</option>
                      <option value="weight-loss">Weight Loss</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="endurance">Endurance</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="workoutSplit" className="text-xs text-muted-foreground/75 font-semibold">Workout Split</Label>
                    <select
                      id="workoutSplit"
                      value={workoutSplit}
                      onChange={(e: any) => setWorkoutSplit(e.target.value)}
                      className="w-full h-9 rounded-xl border border-border/50 bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7F22FE]/40 focus:border-[#7F22FE]/40 transition-colors"
                    >
                      <option value="">Select training split</option>
                      <option value="push-pull-legs">Push-Pull-Legs (PPL)</option>
                      <option value="upper-lower">Upper / Lower</option>
                      <option value="full-body">Full Body</option>
                      <option value="bro-split">Bro Split (Single Muscle Group)</option>
                      <option value="custom">Custom split</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="foodPreference" className="text-xs text-muted-foreground/75 font-semibold">Diet Preference</Label>
                    <select
                      id="foodPreference"
                      value={foodPreference}
                      onChange={(e: any) => setFoodPreference(e.target.value)}
                      className="w-full h-9 rounded-xl border border-border/50 bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7F22FE]/40 focus:border-[#7F22FE]/40 transition-colors"
                    >
                      <option value="">Select preference</option>
                      <option value="non-veg">Non-Vegetarian</option>
                      <option value="veg">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="jain">Jain</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Privacy Card */}
              <Card className="bg-card/70 border-border/50 backdrop-blur-xl p-6 rounded-3xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-[#7F22FE]/10 border border-[#7F22FE]/20 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-[#7F22FE]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Privacy & Security</h2>
                    <p className="text-[10px] text-muted-foreground/50">Manage profile and visibility status</p>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between p-3.5 bg-muted/5 border border-border/40 rounded-2xl">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Profile Visibility</p>
                      <p className="text-[10px] text-muted-foreground/60">Allow other guild mates to search and view your level</p>
                    </div>
                    <Switch 
                      checked={profileVisible} 
                      onCheckedChange={setProfileVisible} 
                      className="data-[state=checked]:bg-[#7F22FE]"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-muted/5 border border-border/40 rounded-2xl">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Activity Status</p>
                      <p className="text-[10px] text-muted-foreground/60">Show when you are online in world map lobbies</p>
                    </div>
                    <Switch 
                      checked={activityVisible} 
                      onCheckedChange={setActivityVisible} 
                      className="data-[state=checked]:bg-[#7F22FE]"
                    />
                  </div>
                </div>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#7F22FE] hover:bg-[#6c1ce5] text-white font-bold px-6 py-2.5 h-10 rounded-xl shadow-lg shadow-[#7F22FE]/10 text-xs flex items-center justify-center gap-2 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Change Password Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-0">
          <div className="lg:col-span-7">
            <Card className="bg-card/70 border-border/50 backdrop-blur-xl p-6 rounded-3xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-9 h-9 rounded-xl bg-[#7F22FE]/10 border border-[#7F22FE]/20 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-[#7F22FE]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Update Password</h2>
                  <p className="text-[10px] text-muted-foreground/50">Change credentials securely</p>
                </div>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPass" className="text-xs text-muted-foreground/75 font-semibold">Current Password</Label>
                    <Input
                      id="currentPass"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-muted/10 border-border/50 text-foreground h-9 rounded-xl text-xs placeholder:text-muted-foreground/30 focus:ring-[#7F22FE]/40"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="newPass" className="text-xs text-muted-foreground/75 font-semibold">New Password</Label>
                    <Input
                      id="newPass"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="bg-muted/10 border-border/50 text-foreground h-9 rounded-xl text-xs placeholder:text-muted-foreground/30 focus:ring-[#7F22FE]/40"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPass" className="text-xs text-muted-foreground/75 font-semibold">Confirm Password</Label>
                    <Input
                      id="confirmPass"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Match new password"
                      className="bg-muted/10 border-border/50 text-foreground h-9 rounded-xl text-xs placeholder:text-muted-foreground/30 focus:ring-[#7F22FE]/40"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={passwordSaving}
                    className="bg-transparent border border-[#7F22FE]/30 text-[#7F22FE] hover:bg-[#7F22FE]/5 font-semibold px-5 h-9 rounded-xl text-xs flex items-center gap-2 transition-all"
                  >
                    {passwordSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
     </div>
    </ProtectedLayout>
  )
}
