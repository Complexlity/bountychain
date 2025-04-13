import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
//Deploy the UsdcMock contract first
// import deployedContracts from '../deployments/chain-31337/deployed_addresses.json'

export default buildModule("NativeV1", (m) => {
  const deployer = m.getAccount(0);
  //Only for test mode
  // let usdc = deployedContracts["UsdcMock#UsdcMock"]
  //Arbitrum Sepolia
  // let usdc = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
  //Arbitrum
  let usdc = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"

  // Deploy the NativeV1Bounty contract using the mock USDC's address
    const nativeV1Bounty = m.contract("NativeV1Bounty", [deployer, usdc]);
    

  return { nativeV1Bounty };
});
