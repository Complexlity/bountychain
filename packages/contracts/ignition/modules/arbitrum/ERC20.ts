import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
//Deploy the UsdcMock contract first
// import deployedContracts from '../deployments/chain-31337/deployed_addresses.json'



export default buildModule("ERC20", (m) => {

    // USDC on Arbitrum (https://arbiscan.io/token/0xaf88d065e77c8cc2239327c5edb3a432268e5831)
    let usdc = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
    const deployer = m.getAccount(0)

    console.log({ deployer })

    const erc20Bounty = m.contract('ERC20Bounty', [deployer, usdc])

    return { erc20Bounty }
})