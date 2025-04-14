import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
//Deploy the UsdcMock contract first
// import deployedContracts from '../deployments/chain-31337/deployed_addresses.json'



export default buildModule("ERC20", (m) => {
    /* Arbitrum Sepolia */
    //USDC on Arbitrum Sepolia(https://sepolia.arbiscan.io/address/0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d)
    let usdc = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"

    const deployer = m.getAccount(0)

    console.log({ deployer })

    const erc20Bounty = m.contract('ERC20Bounty', [deployer, usdc])

    return { erc20Bounty }
})