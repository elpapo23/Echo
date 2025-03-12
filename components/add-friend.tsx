"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ethers } from "ethers"

interface AddFriendProps {
  onAddFriend: (address: string, name: string) => Promise<void>
  contract: ethers.Contract | null
}

export default function AddFriend({ onAddFriend, contract }: AddFriendProps) {
  const [address, setAddress] = useState("")
  const [username, setUsername] = useState("")
  const [nickname, setNickname] = useState("")
  const [adding, setAdding] = useState(false)
  const [addressTab, setAddressTab] = useState<"address" | "username">("address")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (addressTab === "address") {
      if (!address.trim() || !nickname.trim()) {
        toast({
          title: "Invalid Input",
          description: "Please enter both address and nickname",
          variant: "destructive",
        })
        return
      }

      if (!address.startsWith("0x") || address.length !== 42) {
        toast({
          title: "Invalid Address",
          description: "Please enter a valid Ethereum address",
          variant: "destructive",
        })
        return
      }

      setAdding(true)
      try {
        await onAddFriend(address, nickname)
        setAddress("")
        setNickname("")
      } finally {
        setAdding(false)
      }
    } else {
      if (!username.trim() || !nickname.trim()) {
        toast({
          title: "Invalid Input",
          description: "Please enter both username and nickname",
          variant: "destructive",
        })
        return
      }

      setAdding(true)
      try {
        if (!contract) {
          toast({
            title: "Contract Error",
            description: "Contract not initialized",
            variant: "destructive",
          })
          return
        }

        try {
          // First get the address from the username
          const friendAddress = await contract.getAddressByUsername(username)

          // Then add the friend using the address
          await onAddFriend(friendAddress, nickname)

          setUsername("")
          setNickname("")

          toast({
            title: "Friend Added",
            description: `${username} has been added to your friends list!`,
          })
        } catch (error: any) {
          console.error("Error adding friend by username:", error)
          if (error.message.includes("Username does not exist")) {
            toast({
              title: "Username Not Found",
              description: "This username does not exist",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Error",
              description: "Failed to add friend",
              variant: "destructive",
            })
          }
        }
      } finally {
        setAdding(false)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Add New Friend</h3>
        <p className="text-sm text-gray-500">Add a friend to start chatting with them on the blockchain</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Tabs value={addressTab} onValueChange={(value) => setAddressTab(value as "address" | "username")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="address">By Address</TabsTrigger>
            <TabsTrigger value="username">By Username</TabsTrigger>
          </TabsList>

          <TabsContent value="address" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Friend's Wallet Address</Label>
              <Input
                id="address"
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={adding}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname-address">Friend's Nickname</Label>
              <Input
                id="nickname-address"
                placeholder="Enter a name for this friend"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={adding}
              />
            </div>
          </TabsContent>

          <TabsContent value="username" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Friend's Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={adding}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname-username">Friend's Nickname</Label>
              <Input
                id="nickname-username"
                placeholder="Enter a name for this friend"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={adding}
              />
            </div>
          </TabsContent>
        </Tabs>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          disabled={(addressTab === "address" ? !address.trim() : !username.trim()) || !nickname.trim() || adding}
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
          Add Friend
        </Button>
      </form>
    </div>
  )
}

