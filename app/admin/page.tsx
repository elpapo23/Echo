"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import AdminDashboard from "@/components/admin-dashboard"
import ConnectWallet from "@/components/connect-wallet"
import { EchoLogo } from "@/components/echo-logo"
import { Footer } from "@/components/footer"

// RedBelly Chat Contract ABI (updated for V4)
const CONTRACT_ABI = [
  // Existing functions
  "function checkUserExists(address pubkey) public view returns(bool)",
  "function createAccount(string calldata name) external",
  "function getUsername(address pubkey) external view returns(string memory)",
  "function getMyFriendList() external view returns(tuple(address pubkey, string name)[] memory)",
  // New functions for statistics
  "function userCount() external view returns(uint256)",
  "function totalMessageCount() external view returns(uint256)",
  "function getTotalUsers() external view returns(uint256)",
  "function getTotalMessages() external view returns(uint256)",
]

export default function AdminPage() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [account, setAccount] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const { toast } = useToast()

  // Updated contract address
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

  // Handle wallet connection
  const handleConnect = async (provider: ethers.BrowserProvider, account: string, signer: ethers.Signer) => {
    setProvider(provider)
    setAccount(account)
    setSigner(signer)

    const contract = await connectContract(signer)
    if (contract) {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-3 px-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <EchoLogo />
              <span className="ml-4 text-lg font-medium">Admin Portal</span>
            </div>
            {account && (
              <div className="text-right">
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
                <p className="text-xl font-medium text-redbelly-blue mb-3">Echo Admin Portal</p>
                <p className="text-gray-500 mb-8 text-center">Connect your wallet to access admin features</p>
                <ConnectWallet onConnect={handleConnect} />
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-redbelly-red" />
              </div>
            ) : (
              <AdminDashboard contract={contract} account={account} />
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}

