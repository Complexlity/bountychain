import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import deployments from '../../deployments/chain-42161/deployed_addresses.json'

export default buildModule("MigrateMock", (m) => {
    const deployer = m.getAccount(0)
    const { "NativeV1#NativeV1Bounty": nativeV1Bounty, "NativeV2#NativeV2Bounty": nativeV2Bounty } = deployments
    const migrateMock = m.contract("BountyMigrator", [deployer, nativeV1Bounty, nativeV2Bounty])
    console.log("Migration contract deployed....")

    return { migrateMock }
})