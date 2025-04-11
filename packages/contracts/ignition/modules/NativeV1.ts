import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
//Deploy the UsdcMock contract first
import deployedContracts from '../deployments/chain-31337/deployed_addresses.json'

export default buildModule("NativeV1", (m) => {
    const deployer = m.getAccount(0);
    let usdc = deployedContracts["UsdcMock#UsdcMock"]

  // Deploy the NativeV1Bounty contract using the mock USDC's address
    const nativeV1Bounty = m.contract("NativeV1Bounty", [deployer, usdc]);
    

  return { nativeV1Bounty };
});
