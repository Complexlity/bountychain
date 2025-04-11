import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
//Deploy the UsdcMock contract first
import deployedContracts from '../deployments/chain-31337/deployed_addresses.json'



export default buildModule("ERC20", (m) => {
    let usdc = deployedContracts["UsdcMock#UsdcMock"]
    
    if (!usdc) {
        console.log("Please deploy the usdc mock contract first")
        console.log("\nExample command:")
        console.log("npx hardhat ignition deploy ignition/modules/UsdcMock.ts --network localhost")
        process.exit(1)
    }
    const deployer = m.getAccount(0)

    const erc20Bounty = m.contract('ERC20Bounty', [deployer, usdc])

    return {erc20Bounty}
})