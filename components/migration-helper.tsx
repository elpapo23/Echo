"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// ABI for the migrator contract
const MIGRATOR_ABI = [
  "function migrateAccount() external",
  "function checkMigrationStatus(address user) external view returns(bool)",
  "function getMigratedCount() external view returns(uint256)",
  "function oldContractAddress() external view returns(address)",
  "function newContractAddress() external view returns(address)",
]

interface MigrationHelperProps {
  provider: ethers.BrowserProvider | null
  account: string
  onMigrationComplete: () => void
}

export default function MigrationHelper({ provider, account, onMigrationComplete }: MigrationHelperProps) {
  const [migrator, setMigrator] = useState<ethers.Contract | null>(null)
  const [hasMigrated, setHasMigrated] = useState<boolean>(false)
  const [totalMigrated, setTotalMigrated] = useState<number>(0)
  const [oldContract, setOldContract] = useState<string>("")
  const [newContract, setNewContract] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [migrating, setMigrating] = useState<boolean>(false)
  const { toast } = useToast()

  // Migrator contract address - this would be deployed separately
  const migratorAddress = "0x1234567890123456789012345678901234567890" // Replace with actual address

  useEffect(() => {
    const initMigrator = async () => {
      if (!provider || !account) return

      try {
        setLoading(true)

        // Create signer
        const signer = await provider.getSigner()

        // Connect to migrator contract
        const migratorContract = new ethers.Contract(migratorAddress, MIGRATOR_ABI, signer)
        setMigrator(migratorContract)

        // Get contract addresses
        const oldAddr = await migratorContract.oldContractAddress()
        const newAddr = await migratorContract.newContractAddress()
        setOldContract(oldAddr)
        setNewContract(newAddr)

        // Check if user has already migrated
        const migrated = await migratorContract.checkMigrationStatus(account)
        setHasMigrated(migrated)

        // Get total migrated count
        const total = await migratorContract.getMigratedCount()
        setTotalMigrated(Number(total))
      } catch (error) {
        console.error("Error initializing migrator:", error)
        toast({
          title: "Connection Error",
          description: "Failed to connect to migration helper contract",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    initMigrator()
  }, [provider, account])

  const handleMigrate = async () => {
    if (!migrator) return

    try {
      setMigrating(true)

      // Call migrate function
      const tx = await migrator.migrateAccount()
      await tx.wait()

      setHasMigrated(true)
      setTotalMigrated((prev) => prev + 1)

      toast({
        title: "Migration Successful",
        description: "Your account has been migrated to the new contract!",
      })

      // Notify parent component
      onMigrationComplete()
    } catch (error: any) {
      console.error("Migration error:", error)
      toast({
        title: "Migration Failed",
        description: error.reason || "Failed to migrate your account",
        variant: "destructive",
      })
    } finally {
      setMigrating(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-redbelly-red" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Contract Migration Helper</CardTitle>
        <CardDescription>Migrate your account and data to the new Echo contract</CardDescription>
      </CardHeader>

      <CardContent>
        {hasMigrated ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Migration Complete</AlertTitle>
            <AlertDescription>Your account has been successfully migrated to the new contract.</AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Contract Update Available</AlertTitle>
              <AlertDescription>
                A new version of the Echo contract is available with improved features. Migrate your account to continue
                using the platform.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-medium">Current Contract</p>
                  <p className="text-gray-500 truncate">{oldContract}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
                <div className="text-sm">
                  <p className="font-medium">New Contract</p>
                  <p className="text-gray-500 truncate">{newContract}</p>
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm font-medium">Migration Progress</p>
                <p className="text-2xl font-bold">{totalMigrated} users migrated</p>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter>
        {!hasMigrated && (
          <Button
            onClick={handleMigrate}
            disabled={migrating || !migrator}
            className="w-full bg-redbelly-red hover:bg-red-600 text-white"
          >
            {migrating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Migrating...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Migrate My Account
              </>
            )}
          </Button>
        )}

        {hasMigrated && (
          <Button onClick={onMigrationComplete} className="w-full">
            Continue to Echo
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

