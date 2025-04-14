import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
//Deploy the UsdcMock contract first
// import deployedContracts from '../deployments/chain-31337/deployed_addresses.json'

export default buildModule("NativeV1", (m) => {
  const deployer = m.getAccount(0);
  console.log({ deployer })

  // USDC on Arbitrum (https://arbiscan.io/token/0xaf88d065e77c8cc2239327c5edb3a432268e5831)
  let usdc = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"

  // Deploy the NativeV1Bounty contract using the mock USDC's address
  const nativeV1Bounty = m.contract("NativeV1Bounty", [deployer, usdc]);


  return { nativeV1Bounty };
});
