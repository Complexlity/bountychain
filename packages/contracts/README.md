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

### Tasks
If changes are made to the contract, in addition to tests, security checks should be done as well.

```bash
bun run hardhat slither
```

This identifies potential vulnerabilities and inconsistencies in the contracts.

[./tasks/slither.ts](./tasks/slither.ts)


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
For Localhost, Run the **UsdcMock** contract first before others.


## Contracts 


### UsdcModck (For Localhost Only 🟨)

It is used a create a dummy ERC20 contract which would them be used in other contracts. This is only application for localhost network. You should an existing erc20 contract on mainnet and testnets 

[./src/Usdc_Mock.sol](./src/Usdc_Mock.sol)

### NativeV1 (Active ✅)

This is the current active contract on the site. It contaains the abiliy to create a bounty on both eth and usdc (or any other erc20 token but for the deployed contract, usdc was used)

[./src/NativeV1.sol](./src/NativeV1.sol)

### ERC20 (Active ✅)

On careful observation, Having a separate contract for different erc20 tokens is a better architechture rather that having to deploy a new native contract each time. This is currently what is used to create the usdc supported contract and hold this state for it. In future, more deployments of this contract could be done for different tokens and chains

[./src/ERC20.sol](./src/ERC20.sol)

### NativeV2 (Inactive 🟨)

This is exactly similar to the NativeV1 contract but it does not have the option to add an ERC20 token on deploy. It only works with ETH on the deployed chain. ERC20 tokens would now use the ERC20 contract. This will be deployed once all current contracts on the site are marked complete

[./src/NativeV2.sol](./src/NativeV2.sol)