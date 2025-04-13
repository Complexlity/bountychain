import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
//Deploy the UsdcMock contract first
// import deployedContracts from '../deployments/chain-31337/deployed_addresses.json'



export default buildModule("ERC20", (m) => {
    // let usdc = deployedContracts["UsdcMock#UsdcMock"]
    
    // if (!usdc) {
    //     console.log("Please deploy the usdc mock contract first")
    //     console.log("\nExample command:")
    //     console.log("npx hardhat ignition deploy ignition/modules/UsdcMock.ts --network localhost")
    //     process.exit(1)
    // }
    //Arbitrum Sepolia
    // let usdc = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"

    //Arbitrum
    let usdc = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
    const deployer = m.getAccount(0)

    const erc20Bounty = m.contract('ERC20Bounty', [deployer, usdc])

    return {erc20Bounty}
})