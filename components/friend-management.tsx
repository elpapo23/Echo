"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import type {} from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, UserPlus, Search, UserX, Shield, UserCheck, AlertCircle, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"

interface Contact {
  pubkey: string
  name: string
  isFriend?: boolean
  isBlocked?: boolean
}

interface FriendManagementProps {
  contract: ethers.Contract | null
  account: string
  onBack: () => void
  onFriendsUpdated: () => void
}

export default function FriendManagement({ contract, account, onBack, onFriendsUpdated }: FriendManagementProps) {
  const [activeTab, setActiveTab] = useState("add")
  const [address, setAddress] = useState("")
  const [username, setUsername] = useState("")
  const [nickname, setNickname] = useState("")
  const [addressTab, setAddressTab] = useState<"address" | "username">("address")
  const [isValidAddress, setIsValidAddress] = useState(false)
  const [friends, setFriends] = useState<Contact[]>([])
  const [blockedUsers, setBlockedUsers] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const isMobile = useMobile()

  // Fetch friends and blocked users when component mounts
  useEffect(() => {
    if (contract) {
      fetchFriends()
      fetchBlockedUsers()
    }
  }, [contract])

  // Validate address when it changes
  useEffect(() => {
    try {
      setIsValidAddress(ethers.isAddress(address))
    } catch {
      setIsValidAddress(false)
    }
  }, [address])

  // Fetch friends list
  const fetchFriends = async () => {
    if (!contract) return

    try {
      setLoading(true)
      const friendsList = await contract.getMyFriendList()
      const directMessageSenders = await contract.getDirectMessageSenders()

      // Create a map of direct message senders for quick lookup
      const dmSendersMap = new Set(directMessageSenders.map((sender: string) => sender.toLowerCase()))

      // Process friends list
      const friendsWithFlag = friendsList.map((friend: any) => ({
        pubkey: friend.pubkey,
        name: friend.name,
        isFriend: true,
      }))

      // Get direct message senders that aren't friends
      const dmSendersPromises = directMessageSenders.map(async (sender: string) => {
        // Skip if this sender is already in the friends list
        if (friendsWithFlag.some((f) => f.pubkey.toLowerCase() === sender.toLowerCase())) {
          return null
        }

        try {
          const exists = await contract.checkUserExists(sender)
          let name = formatAddress(sender)

          if (exists) {
            const username = await contract.getUsername(sender)
            if (username) {
              name = username
            }
          }

          return {
            pubkey: sender,
            name,
            isFriend: false,
          }
        } catch (error) {
          console.error(`Error fetching info for ${sender}:`, error)
          return {
            pubkey: sender,
            name: formatAddress(sender),
            isFriend: false,
          }
        }
      })

      const dmSenders = (await Promise.all(dmSendersPromises)).filter(Boolean)

      // Combine friends and DM senders
      setFriends([...friendsWithFlag, ...dmSenders])
    } catch (error) {
      console.error("Error fetching friends:", error)
      toast({
        title: "Error",
        description: "Failed to fetch friends list",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch blocked users (mock implementation - the contract doesn't have a getBlockedUsers function)
  // In a real implementation, you would need to track blocked users in the contract
  const fetchBlockedUsers = async () => {
    if (!contract) return

    // This is a placeholder. In a real implementation, you would need to
    // modify the contract to store and retrieve blocked users
    setBlockedUsers([])
  }

  // Add a friend
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contract) return

    if (addressTab === "address") {
      if (!isValidAddress || !nickname.trim()) {
        toast({
          title: "Invalid Input",
          description: "Please enter both a valid address and nickname",
          variant: "destructive",
        })
        return
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
    }

    try {
      setActionLoading(true)

      if (addressTab === "address") {
        // Check if user exists first
        const exists = await contract.checkUserExists(address)
        if (!exists) {
          toast({
            title: "User Not Registered",
            description: "This address has not registered an account yet",
            variant: "destructive",
          })
          return
        }

        const tx = await contract.addFriend(address, nickname)
        await tx.wait()

        setAddress("")
        setNickname("")

        toast({
          title: "Friend Added",
          description: `${nickname} has been added to your friends list!`,
        })
      } else {
        try {
          // First check if username exists
          const friendAddress = await contract.getAddressByUsername(username)

          const tx = await contract.addFriend(friendAddress, nickname)
          await tx.wait()

          setUsername("")
          setNickname("")

          toast({
            title: "Friend Added",
            description: `${nickname} has been added to your friends list!`,
          })
        } catch (error: any) {
          if (error.message?.includes("Username does not exist")) {
            toast({
              title: "Username Not Found",
              description: "This username does not exist",
              variant: "destructive",
            })
            return
          }
          throw error
        }
      }

      // Refresh friends list
      await fetchFriends()
      onFriendsUpdated()
    } catch (error: any) {
      console.error("Error adding friend:", error)

      if (error.message?.includes("User is not registered")) {
        toast({
          title: "User Not Registered",
          description: "This address has not registered an account yet",
          variant: "destructive",
        })
      } else if (error.message?.includes("already friends")) {
        toast({
          title: "Already Friends",
          description: "You are already friends with this user",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to add friend: " + (error.reason || error.message || "Unknown error"),
          variant: "destructive",
        })
      }
    } finally {
      setActionLoading(false)
    }
  }

  // Remove a contact
  const handleRemoveContact = async (contact: Contact) => {
    if (!contract) return

    try {
      setActionLoading(true)

      // Check if this is a friend - we can't remove friends with removeDirectMessageSender
      if (contact.isFriend) {
        toast({
          title: "Cannot Remove Friend",
          description: "The contract doesn't support removing friends. You can block them instead.",
          variant: "destructive",
        })
        setActionLoading(false)
        return
      }

      // Only try to remove direct message senders
      const tx = await contract.removeDirectMessageSender(contact.pubkey)
      await tx.wait()

      toast({
        title: "Contact Removed",
        description: `${contact.name} has been removed from your direct messages list`,
      })

      // Remove from local state
      setFriends((prev) => prev.filter((f) => f.pubkey !== contact.pubkey))

      // Update the parent component
      onFriendsUpdated()
    } catch (error: any) {
      console.error("Error removing contact:", error)
      toast({
        title: "Error",
        description: "Failed to remove contact: " + (error.reason || error.message || "Unknown error"),
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Block a user
  const handleBlockUser = async (contact: Contact) => {
    if (!contract) return

    try {
      setActionLoading(true)

      const tx = await contract.blockUser(contact.pubkey)
      await tx.wait()

      toast({
        title: "User Blocked",
        description: `${contact.name} has been blocked`,
      })

      // Update the blocked users list
      fetchBlockedUsers()
    } catch (error) {
      console.error("Error blocking user:", error)
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Unblock a user
  const handleUnblockUser = async (contact: Contact) => {
    if (!contract) return

    try {
      setActionLoading(true)

      const tx = await contract.unblockUser(contact.pubkey)
      await tx.wait()

      toast({
        title: "User Unblocked",
        description: `${contact.name} has been unblocked`,
      })

      // Update the blocked users list
      fetchBlockedUsers()
    } catch (error) {
      console.error("Error unblocking user:", error)
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  // Filter friends based on search query
  const filteredFriends = friends.filter((friend) => {
    if (!searchQuery) return true

    const name = friend.name.toLowerCase()
    const address = friend.pubkey.toLowerCase()
    const query = searchQuery.toLowerCase()

    return name.includes(query) || address.includes(query)
  })

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-medium">Manage Contacts</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 gap-2 px-4 py-3 bg-white">
          <TabsTrigger value="add" className="data-[state=active]:bg-redbelly-red data-[state=active]:text-white">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Contact
          </TabsTrigger>
          <TabsTrigger value="manage" className="data-[state=active]:bg-redbelly-red data-[state=active]:text-white">
            <UserCheck className="h-4 w-4 mr-2" />
            My Contacts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="flex-1 p-4 m-0">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleAddFriend} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-1">Add New Contact</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Add a contact to start chatting with them on the blockchain
                    </p>
                  </div>

                  <Tabs
                    value={addressTab}
                    onValueChange={(value) => setAddressTab(value as "address" | "username")}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="address">By Address</TabsTrigger>
                      <TabsTrigger value="username">By Username</TabsTrigger>
                    </TabsList>

                    <TabsContent value="address" className="space-y-4 mt-0">
                      <div className="space-y-2">
                        <Label htmlFor="address">Wallet Address</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="address"
                            placeholder="0x..."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="pl-9"
                            disabled={actionLoading}
                          />
                        </div>
                        {address && !isValidAddress && (
                          <p className="text-sm text-red-500 flex items-center mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Please enter a valid Ethereum address
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nickname-address">Contact Name</Label>
                        <Input
                          id="nickname-address"
                          placeholder="Enter a name for this contact"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          disabled={actionLoading}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="username" className="space-y-4 mt-0">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="username"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="pl-9"
                            disabled={actionLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nickname-username">Contact Name</Label>
                        <Input
                          id="nickname-username"
                          placeholder="Enter a name for this contact"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          disabled={actionLoading}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Button
                    type="submit"
                    className="w-full bg-redbelly-red hover:bg-red-600 text-white"
                    disabled={
                      (addressTab === "address" ? !isValidAddress : !username.trim()) ||
                      !nickname.trim() ||
                      actionLoading
                    }
                  >
                    {actionLoading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Add Contact
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="flex-1 p-4 m-0">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-100 border-gray-200"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <h3 className="font-medium p-3 border-b">My Contacts ({friends.length})</h3>

            <ScrollArea className="h-[calc(100vh-350px)] min-h-[200px]">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-redbelly-red border-t-transparent rounded-full" />
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-gray-500">
                  {searchQuery ? (
                    <>
                      <Search className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-center">No contacts match your search</p>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-center">You haven't added any contacts yet</p>
                      <p className="text-center text-sm mt-1">Switch to the "Add Contact" tab to get started</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredFriends.map((friend) => (
                    <div key={friend.pubkey} className="p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback
                              className={
                                friend.isFriend
                                  ? "bg-gradient-to-br from-redbelly-red to-red-700 text-white"
                                  : "bg-gradient-to-br from-gray-700 to-gray-900 text-white"
                              }
                            >
                              {friend.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center">
                              <p className="font-medium">{friend.name}</p>
                              {!friend.isFriend && (
                                <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                                  Direct Message
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{formatAddress(friend.pubkey)}</p>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleBlockUser(friend)}
                            disabled={actionLoading}
                            title="Block Contact"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleRemoveContact(friend)}
                            disabled={actionLoading || friend.isFriend}
                            title={
                              friend.isFriend
                                ? "Friends cannot be removed (only blocked)"
                                : "Remove from direct messages"
                            }
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {blockedUsers.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border mt-4">
              <h3 className="font-medium p-3 border-b">Blocked Contacts ({blockedUsers.length})</h3>

              <ScrollArea className="max-h-[200px]">
                <div className="divide-y">
                  {blockedUsers.map((user) => (
                    <div key={user.pubkey} className="p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gray-700 text-white">
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-gray-500">{formatAddress(user.pubkey)}</p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gray-700"
                          onClick={() => handleUnblockUser(user)}
                          disabled={actionLoading}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Unblock
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

