# Bountychain Contracts

This contains the contracts used for bountychain (https://bountychain.xyz). It uses hardhat(https://hardhat.org/) for compilation and deployment.

## Getting Started

### Prerequisites
- Node.js 18.x
- bun (https://bun.sh/)


### Installation
```bash
bun install
```

### Compile
```bash
bun run compile
```

### Test
```bash
bun run test
```

### Hardhat Variables

```bash
npx hardhat vars set <VARIABLE_NAME> 
```

** Variable Names **

- **ALCHEMY_API_KEY** 
    Used to deploy contracts on mainnet or testnet
- **ARB_SEPOLIA_PRIVATE_KEY** 
    Private key used for deploying on arbitrum sepoli
- **ARB_PRIVATE_KEY** 
    Private key used for deploying on arbitrum.  Same private keys can be used but it is recommended to be a bit more careful with non-testnet keys
- **ARBISCAN_API_KEY** 
    Used to verify contract on arbiscan programmatically

Example
```bash
npx hardhat vars set ALCHEMY_API_KEY
```

## Deploy And Verify


```
npx hardhat ignition deploy ignition/modules/<NETWORK_NAME>/<MODULE_NAME>.ts --network <NETWORK_NAME>
```


** Supported Networks Names **
- **arbitrum**
- **arbitrumSepolia**
- **localhost**


** Module(contract) Names **
- **ERC20**
- **NativeV1**
- **NativeV2**
- **UsdcMock**

** NOTE **
For Localhost, Run the UsdcMock contract first before others.




