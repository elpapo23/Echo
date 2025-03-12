"use client"

import { cn } from "@/lib/utils"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, MessageSquare, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ConnectWallet from "@/components/connect-wallet"
import UserRegistration from "@/components/user-registration"
import { EchoLogo } from "@/components/echo-logo"
import { Footer } from "@/components/footer"
import ModernContactList from "@/components/modern-contact-list"
import ModernChatInterface from "@/components/modern-chat-interface"
import ModernDirectMessage from "@/components/modern-direct-message"
import FriendManagement from "@/components/friend-management"
import { useMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"

// RedBelly Chat Contract ABI
const CONTRACT_ABI = [
  "function checkUserExists(address pubkey) public view returns(bool)",
  "function checkUsernameExists(string calldata username) public view returns(bool)",
  "function createAccount(string calldata name) external",
  "function getUsername(address pubkey) external view returns(string memory)",
  "function getAddressByUsername(string calldata username) external view returns(address)",
  "function addFriend(address friend_key, string calldata name) external",
  "function addFriendByUsername(string calldata username, string calldata nickname) external",
  "function getMyFriendList() external view returns(tuple(address pubkey, string name)[] memory)",
  "function sendMessage(address friend_key, string calldata _msg) external",
  "function sendMessageByUsername(string calldata username, string calldata _msg) external",
  "function readMessage(address friend_key) external view returns(tuple(address sender, uint256 timestamp, string msg, bool isDelivered)[] memory)",
  "function readMessageByUsername(string calldata username) external view returns(tuple(address sender, uint256 timestamp, string msg, bool isDelivered)[] memory)",
  "function sendDirectMessage(address receiver_key, string calldata _msg) external",
  "function sendDirectMessageByUsername(string calldata username, string calldata _msg) external",
  "function readDirectMessage(address other_key) external view returns(tuple(address sender, uint256 timestamp, string msg, bool isDelivered)[] memory)",
  "function readDirectMessageByUsername(string calldata username) external view returns(tuple(address sender, uint256 timestamp, string msg, bool isDelivered)[] memory)",
  "function blockUser(address user_to_block) external",
  "function blockUserByUsername(string calldata username) external",
  "function unblockUser(address user_to_unblock) external",
  "function unblockUserByUsername(string calldata username) external",
  "function isBlocked(address user) external view returns(bool)",
  "function getDirectMessageSenders() external view returns(address[] memory)",
  "function removeDirectMessageSender(address sender) external",
  "function getAccountCreationTime(address pubkey) public view returns(uint256)",
  // New functions for statistics
  "function userCount() external view returns(uint256)",
  "function totalMessageCount() external view returns(uint256)",
  "function getTotalUsers() external view returns(uint256)",
  "function getTotalMessages() external view returns(uint256)",
]

export default function Home() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [account, setAccount] = useState<string>("")
  const [isRegistered, setIsRegistered] = useState<boolean>(false)
  const [username, setUsername] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [friends, setFriends] = useState<{ pubkey: string; name: string; isFriend?: boolean }[]>([])
  const [selectedContact, setSelectedContact] = useState<{ pubkey: string; name: string; isFriend?: boolean } | null>(
    null,
  )
  const [showDirectMessage, setShowDirectMessage] = useState<boolean>(false)
  const [showFriendManagement, setShowFriendManagement] = useState<boolean>(false)
  const [showContactList, setShowContactList] = useState<boolean>(true)
  const { toast } = useToast()
  const isMobile = useMobile()

  // Updated with the contract address
  const contractAddress = "0x56A15aE8Fa8D2B09600A6F58bb7A34D0d29Ea091"

  // Connect to the blockchain and contract
  const connectContract = async (signer: ethers.Signer) => {
    try {
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer)
      setContract(contract)
      return contract
    } catch (error) {
      console.error("Error connecting to contract:", error)
      toast({
        title: "Contract Connection Error",
        description: "Failed to connect to the Echo contract",
        variant: "destructive",
      })
      return null
    }
  }

  // Check if user is registered
  const checkUserRegistration = async (contractInstance: ethers.Contract, address: string) => {
    try {
      const exists = await contractInstance.checkUserExists(address)
      setIsRegistered(exists)

      if (exists) {
        const name = await contractInstance.getUsername(address)
        setUsername(name)
        fetchFriends(contractInstance)
      }

      setLoading(false)
    } catch (error) {
      console.error("Error checking user registration:", error)
      setLoading(false)
    }
  }

  // Update the friends mapping when fetching
  const fetchFriends = async (contractInstance: ethers.Contract | null = null) => {
    const contractToUse = contractInstance || contract
    if (!contractToUse) return

    try {
      const friendsList = await contractToUse.getMyFriendList()
      // Explicitly map the friends with isFriend property
      setFriends(
        friendsList.map((friend) => ({
          pubkey: friend.pubkey,
          name: friend.name,
          isFriend: true,
        })),
      )
    } catch (error) {
      console.error("Error fetching friends:", error)
      toast({
        title: "Error",
        description: "Failed to fetch friends list",
        variant: "destructive",
      })
    }
  }

  // Add this after the fetchFriends function
  const loadRecentRecipients = async () => {
    if (!contract) return

    try {
      // Check local storage for recent recipients
      const recentRecipients = JSON.parse(localStorage.getItem("recentRecipients") || "[]")

      if (recentRecipients.length > 0) {
        // Process each recipient
        const recipientsData = await Promise.all(
          recentRecipients.map(async (address: string) => {
            try {
              const exists = await contract.checkUserExists(address)
              let name = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`

              if (exists) {
                const username = await contract.getUsername(address)
                if (username) {
                  name = username
                }
              }

              // Check if this is already a friend
              const isFriend = friends.some((f) => f.pubkey.toLowerCase() === address.toLowerCase())

              if (!isFriend) {
                return {
                  pubkey: address,
                  name,
                  isFriend: false,
                }
              }
              return null
            } catch (error) {
              console.error(`Error processing recipient ${address}:`, error)
              return null
            }
          }),
        )

        // Filter out nulls and add to friends list
        const validRecipients = recipientsData.filter(Boolean)
        if (validRecipients.length > 0) {
          setFriends((prev) => {
            // Only add recipients that aren't already in the list
            const newFriends = [...prev]
            validRecipients.forEach((recipient) => {
              if (!newFriends.some((f) => f.pubkey.toLowerCase() === recipient.pubkey.toLowerCase())) {
                newFriends.push(recipient)
              }
            })
            return newFriends
          })
        }
      }
    } catch (error) {
      console.error("Error loading recent recipients:", error)
    }
  }

  // Call this function after fetching friends
  useEffect(() => {
    if (contract && isRegistered) {
      loadRecentRecipients()
    }
  }, [contract, isRegistered, friends.length])

  // Handle wallet connection
  const handleConnect = async (provider: ethers.BrowserProvider, account: string, signer: ethers.Signer) => {
    setProvider(provider)
    setAccount(account)
    setSigner(signer)

    const contract = await connectContract(signer)
    if (contract) {
      await checkUserRegistration(contract, account)
    }
  }

  // Handle user registration
  const handleRegistration = async (name: string) => {
    if (!contract) return

    try {
      setLoading(true)
      const tx = await contract.createAccount(name)
      await tx.wait()

      setIsRegistered(true)
      setUsername(name)

      toast({
        title: "Registration Successful",
        description: "Your account has been created!",
      })
    } catch (error) {
      console.error("Error registering user:", error)
      toast({
        title: "Registration Error",
        description: "Failed to register user",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle selecting a contact to chat with
  const handleSelectContact = (contact: { pubkey: string; name: string; isFriend?: boolean }) => {
    setSelectedContact(contact)
    setShowDirectMessage(false)
    setShowFriendManagement(false)
    if (isMobile) {
      setShowContactList(false)
    }
  }

  // Toggle direct message view
  const handleNewMessage = () => {
    setShowDirectMessage(true)
    setShowFriendManagement(false)
    setSelectedContact(null)
    if (isMobile) {
      setShowContactList(false)
    }
  }

  // Toggle friend management view
  const handleManageContacts = () => {
    setShowFriendManagement(true)
    setShowDirectMessage(false)
    setSelectedContact(null)
    if (isMobile) {
      setShowContactList(false)
    }
  }

  // Handle back navigation for mobile
  const handleBack = () => {
    setShowContactList(true)
  }

  // Render loading state
  if (loading && account) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-redbelly-red" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-3 px-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <EchoLogo />
            {isRegistered && account && (
              <div className="text-right">
                <p className="font-medium">{username}</p>
                <p className="text-xs text-gray-500 truncate max-w-[150px]">{account}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-grow">
        <Card className="shadow-sm border-0 overflow-hidden">
          <CardContent className="p-0">
            {!account ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <EchoLogo className="h-16 w-16 mb-4" />
                <p className="text-xl font-medium text-redbelly-blue mb-3">
                  Redbelly's First Decentralized Blockchain Messenger
                </p>
                <p className="text-gray-500 mb-8 text-center">
                  Connect your wallet to start messaging on the blockchain
                </p>
                <ConnectWallet onConnect={handleConnect} />
              </div>
            ) : !isRegistered ? (
              <UserRegistration onRegister={handleRegistration} contract={contract} />
            ) : (
              <div className={cn("grid h-[80vh]", isMobile ? "grid-cols-1" : "md:grid-cols-[350px_1fr]")}>
                {/* Contact list - conditionally shown on mobile */}
                {(!isMobile || showContactList) && (
                  <div className="border-r bg-white">
                    <ModernContactList
                      contacts={friends}
                      selectedContact={selectedContact}
                      onSelectContact={handleSelectContact}
                      contract={contract}
                      account={account}
                      onNewMessage={handleNewMessage}
                      onManageContacts={handleManageContacts}
                    />
                  </div>
                )}

                {/* Chat area - conditionally shown on mobile */}
                {(!isMobile || !showContactList) && (
                  <div className="flex flex-col h-full">
                    {showDirectMessage ? (
                      <ModernDirectMessage contract={contract} account={account} onBack={handleBack} />
                    ) : showFriendManagement ? (
                      <FriendManagement
                        contract={contract}
                        account={account}
                        onBack={handleBack}
                        onFriendsUpdated={fetchFriends}
                      />
                    ) : selectedContact ? (
                      <ModernChatInterface
                        recipient={selectedContact}
                        contract={contract}
                        account={account}
                        onBack={handleBack}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                        <div className="bg-gray-100 rounded-full p-6 mb-4">
                          <MessageSquare className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-center font-medium">No conversation selected</p>
                        <p className="text-center text-sm mt-1 mb-4">Select a contact or start a new conversation</p>
                        <div className="flex gap-3">
                          <Button onClick={handleNewMessage} className="bg-redbelly-red hover:bg-red-600 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            New Message
                          </Button>
                          <Button onClick={handleManageContacts} variant="outline">
                            Manage Contacts
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}

