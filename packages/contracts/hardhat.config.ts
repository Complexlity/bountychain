import "@nomicfoundation/hardhat-toolbox-viem";
import { type HardhatUserConfig, vars } from "hardhat/config";
import './tasks'


const ETHERSCAN_API_KEY = vars.get('ETHERSCAN_API_KEY')
const ALCHEMY_API_KEY = vars.get('ALCHEMY_API_KEY')
const ARB_SEPOLIA_PRIVATE_KEY = vars.get('ARB_SEPOLIA_PRIVATE_KEY')
const ARB_PRIVATE_KEY = vars.get('ARB_PRIVATE_KEY')
const ARBISCAN_API_KEY = vars.get('ARBISCAN_API_KEY')



const config: HardhatUserConfig = {
  solidity: "0.8.28",
  paths: {
    sources: "./src",
  }, 
  sourcify: {
    enabled: true,
  },
  networks: {
    arbitrumSepolia: {
      url: `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [ARB_SEPOLIA_PRIVATE_KEY],
    }, 
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [ARB_PRIVATE_KEY],
    }, 
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      arbitrumOne: ARBISCAN_API_KEY,
      arbitrumSepolia : ARBISCAN_API_KEY,
    }
  }
};
 
export default config;

