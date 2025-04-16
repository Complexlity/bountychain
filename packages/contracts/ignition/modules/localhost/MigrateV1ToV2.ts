import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import deployments from '../../deployments/chain-31337/deployed_addresses.json'
export default buildModule("MigrateMock", (m) => {
    const deployer = m.getAccount(0)
    const { "NativeV1#NativeV1Bounty": nativeV1Mock, "NativeV2#NativeV2Bounty": nativeV2Mock } = deployments
    const migrateMock = m.contract("BountyMigrator", [deployer, nativeV1Mock, nativeV2Mock])
    console.log("Migration contract deployed....")

    return { migrateMock }
})