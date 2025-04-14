import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'


export default buildModule("NativeV2", (m) => {
    const deployer = m.getAccount(0)
    const nativeV2Bounty = m.contract('NativeV2Bounty', [deployer])
    return {nativeV2Bounty}
})