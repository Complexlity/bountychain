import "@nomicfoundation/hardhat-toolbox-viem";
import { type HardhatUserConfig, vars } from "hardhat/config";
import './tasks'
import { SUPPORTED_NETWORKS } from "./lib/constants";


const ARBISCAN_API_KEY = vars.get('ARBISCAN_API_KEY')



const config: HardhatUserConfig = {
  solidity: "0.8.28",
  paths: {
    sources: "./src",
  }, 
  sourcify: {
    enabled: true,
  },
  networks: SUPPORTED_NETWORKS,
  etherscan: {
    apiKey: {
      arbitrumOne: ARBISCAN_API_KEY,
      arbitrumSepolia : ARBISCAN_API_KEY,
    }
  }
};
 
export default config;

