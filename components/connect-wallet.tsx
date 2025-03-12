"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { EchoLogoSmall } from "./echo-logo"

interface ConnectWalletProps {
  onConnect: (provider: ethers.BrowserProvider, account: string, signer: ethers.Signer) => void
}

export default function ConnectWallet({ onConnect }: ConnectWalletProps) {
  const [connecting, setConnecting] = useState(false)
  const { toast } = useToast()

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "Wallet Not Found",
        description: "Please install MetaMask or another Ethereum wallet",
        variant: "destructive",
      })
      return
    }

    try {
      setConnecting(true)

      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" })

      // Create ethers provider
      const provider = new ethers.BrowserProvider(window.ethereum)

      // Get the signer
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      // Check if we need to switch to Redbelly Network
      try {
        // This would be the actual Redbelly Network chain ID
        const redbellychainId = "0x97" // Chain ID 151 in hex

        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: redbellychainId }],
        })
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x97", // Chain ID 151 in hex
                  chainName: "Redbelly Network Mainnet",
                  nativeCurrency: {
                    name: "RBNT",
                    symbol: "RBNT",
                    decimals: 18,
                  },
                  rpcUrls: ["https://governors.mainnet.redbelly.network"],
                  blockExplorerUrls: ["https://redbelly.routescan.io"],
                },
              ],
            })
          } catch (addError) {
            console.error("Error adding Redbelly Network:", addError)
            toast({
              title: "Network Error",
              description: "Failed to add Redbelly Network Mainnet to your wallet",
              variant: "destructive",
            })
          }
        } else {
          console.error("Error switching to Redbelly Network:", switchError)
          toast({
            title: "Network Error",
            description: "Failed to switch to Redbelly Network Mainnet",
            variant: "destructive",
          })
        }
      }

      onConnect(provider, address, signer)

      toast({
        title: "Wallet Connected",
        description: "Your wallet has been connected to Echo!",
      })
    } catch (error) {
      console.error("Error connecting wallet:", error)
      toast({
        title: "Connection Error",
        description: "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      setConnecting(false)
    }
  }

  return (
    <Button
      onClick={connectWallet}
      disabled={connecting}
      className="bg-redbelly-red hover:bg-red-600 text-white"
      size="lg"
    >
      {connecting ? (
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
      ) : (
        <div className="flex items-center">
          <EchoLogoSmall className="h-5 w-5 mr-2" />
          <span>Connect Wallet</span>
        </div>
      )}
    </Button>
  )
}

