"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, UserPlus, AlertCircle, Check } from "lucide-react"
import { EchoLogo } from "./echo-logo"
import type { ethers } from "ethers"

interface UserRegistrationProps {
  onRegister: (name: string) => Promise<void>
  contract: ethers.Contract | null
}

export default function UserRegistration({ onRegister, contract }: UserRegistrationProps) {
  const [name, setName] = useState("")
  const [registering, setRegistering] = useState(false)
  const [checking, setChecking] = useState(false)
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null)
  const [nameChecked, setNameChecked] = useState("")

  // Check if username is available
  const checkUsername = async () => {
    if (!contract || !name.trim()) return

    try {
      setChecking(true)
      const exists = await contract.checkUsernameExists(name)
      setNameAvailable(!exists)
      setNameChecked(name)
    } catch (error) {
      console.error("Error checking username:", error)
      setNameAvailable(null)
    } finally {
      setChecking(false)
    }
  }

  // Handle input change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)

    // Reset availability status if name changes
    if (newName !== nameChecked) {
      setNameAvailable(null)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    // Check username availability first if not already checked
    if (nameChecked !== name || nameAvailable === null) {
      await checkUsername()
      return
    }

    // If username is not available, don't proceed
    if (!nameAvailable) return

    setRegistering(true)
    try {
      await onRegister(name)
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="bg-redbelly-red text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              Create Your Echo Account
            </CardTitle>
            <EchoLogo className="h-6 w-6" />
          </div>
          <CardDescription className="text-gray-100">Register to start messaging on the blockchain</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Your Display Name
                </label>
                <div className="relative">
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={handleNameChange}
                    disabled={registering}
                    required
                    className={
                      nameAvailable === false
                        ? "border-red-500 pr-10"
                        : nameAvailable === true
                          ? "border-green-500 pr-10"
                          : ""
                    }
                    onBlur={checkUsername}
                  />
                  {checking && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                  {!checking && nameAvailable === false && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                  {!checking && nameAvailable === true && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
                {nameAvailable === false && (
                  <p className="text-sm text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    This username is already taken
                  </p>
                )}
                {nameAvailable === true && (
                  <p className="text-sm text-green-500 flex items-center mt-1">
                    <Check className="h-3 w-3 mr-1" />
                    Username is available
                  </p>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-redbelly-red hover:bg-red-600 text-white"
              disabled={!name.trim() || registering || nameAvailable === false || checking}
            >
              {registering || (checking && nameChecked === name) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {registering ? "Registering..." : checking && nameChecked === name ? "Checking..." : "Register Account"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

