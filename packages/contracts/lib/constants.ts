import { vars } from "hardhat/config";
import { arbitrum, arbitrumSepolia } from "viem/chains";


 
const ALCHEMY_API_KEY = vars.get('ALCHEMY_API_KEY')
const ARB_SEPOLIA_PRIVATE_KEY = vars.get('ARB_SEPOLIA_PRIVATE_KEY')
const ARB_PRIVATE_KEY = vars.get('ARB_PRIVATE_KEY')
export const SUPPORTED_NETWORKS = {
    arbitrumSepolia: {
        chainId: arbitrumSepolia.id,
        url: `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        accounts: [ARB_SEPOLIA_PRIVATE_KEY],
        //Depoloyed contracts: See /ignition/deployments
        contracts: {
            usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
            nativeV1Bounty: "0x73816da23679f0d45cb96B4Eb87026a564aeB467",
            nativeV2Bounty: "0x95223fcF6187CeF2b1047F6a056ff0a2149d639F",
            erc20Bounty: "0x3412951CE272E9Bf1B1CAD1eE232b3c0654A0529"
        }
    
    },
    arbitrum: {
        chainId: arbitrum.id,
        url: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        accounts: [ARB_PRIVATE_KEY],
        //Depoloyed contracts: See /ignition/deployments
        contracts: {
            usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
            nativeV1Bounty: "0xF71A995BEe0eb8cD2c1a0509Ddf38F59EC98383b",
            nativeV2Bounty: "0x8f95B512813722cCA4A25C4ed216096ff04CB65F",
            erc20Bounty: "0xc8a524Ca1Af094f7DD6AB4E132a0B5aEe4d3174a"
      }
    },
} 
