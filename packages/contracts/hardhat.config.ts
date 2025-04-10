import "@nomicfoundation/hardhat-toolbox-viem";
import { type HardhatUserConfig } from "hardhat/config";
import './tasks'



const config: HardhatUserConfig = {
  solidity: "0.8.28",
  paths: {
    sources: "./src",

  }
};

export default config;
