import "@nomicfoundation/hardhat-toolbox-viem";
import { task } from "hardhat/config";
import {
    Address,
    Hex,
    formatEther
} from 'viem';
import * as chains from 'viem/chains';
import deploymentAddressLocalhost from '../ignition/deployments/chain-31337/deployed_addresses.json';
import deploymentAddressArbitrum from '../ignition/deployments/chain-42161/deployed_addresses.json';
import deploymentAddressArbitrumSepolia from '../ignition/deployments/chain-421614/deployed_addresses.json';

task("migrateToV2", "Migrates bounties to V2")
    .addOptionalParam("startBlock", "The block to start fetching events from", "0")
    .setAction(async (taskArgs, hre) => {
        const migrateNetwork = hre.network.name

        const deploymentAddress = migrateNetwork === 'localhost' ? deploymentAddressLocalhost : migrateNetwork === 'arbitrum' ? deploymentAddressArbitrum : deploymentAddressArbitrumSepolia

        // Ensure required environment variables are set
        const NATIVE_V1_ADDRESS = deploymentAddress["NativeV1#NativeV1Bounty"] as Address
        const MIGRATOR_ADDRESS = deploymentAddress["MigrateMock#BountyMigrator"] as Address
        if (!NATIVE_V1_ADDRESS) {
            console.log("Please deploy the native v1 contract first")
            console.log("\nExample command:")
            console.log("npx hardhat ignition deploy ignition/modules/<NETWORK_NAME>/NativeV1.ts --network <NETWORK_NAME>")
            process.exit(1)
        }
        if (!MIGRATOR_ADDRESS) {
            console.log("Please deploy the migrator contract first")
            console.log("\nExample command:")
            console.log("npx hardhat ignition deploy ignition/modules/<NETWORK_NAME>/MigrateV1ToV2.ts --network <NETWORK_NAME>")
            process.exit(1)
        }


        const nativeV1Bounty = await hre.viem.getContractAt('NativeV1Bounty', NATIVE_V1_ADDRESS)
        const migrator = await hre.viem.getContractAt('BountyMigrator', MIGRATOR_ADDRESS)
        const [deployer] = await hre.viem.getWalletClients()

        const migratorAddress = MIGRATOR_ADDRESS as Address;

        // Setup wallet client
        const account = deployer.account

        // Setup public client for read operations
        const publicClient = await hre.viem.getPublicClient()

        // Setup wallet client for write operations
        const walletClient = deployer

        const startBlock = BigInt(taskArgs.startBlock);

        console.log(`Fetching events from block ${startBlock} to latest...`);

        const bountyCreatedEvents = await publicClient.getContractEvents({
            address: nativeV1Bounty.address,
            abi: nativeV1Bounty.abi,
            eventName: "BountyCreated",
            fromBlock: startBlock,
            toBlock: "latest",
        });

        console.log(`Found ${bountyCreatedEvents.length} total bounty events`);

        const ethBountyIds: Hex[] = [];
        let totalEthNeeded = 0n;

        for (const event of bountyCreatedEvents) {
            const bountyId = event.args.bountyId as Hex;
            const tokenType = event.args.tokenType;

            if (tokenType === 0) {
                const bountyInfo = await publicClient.readContract({
                    address: nativeV1Bounty.address,
                    abi: nativeV1Bounty.abi,
                    functionName: "getBountyInfo",
                    args: [bountyId],
                });

                const isPaid = bountyInfo[3];

                if (!isPaid) {
                    ethBountyIds.push(bountyId);
                    totalEthNeeded += bountyInfo[1];
                }
            }
        }

        console.log(`Found ${ethBountyIds.length} unpaid ETH bounties`);
        console.log(`Total ETH needed for migration: ${formatEther(totalEthNeeded)} ETH`);

        if (totalEthNeeded > 0n) {
            console.log("Funding migrator contract...");

            const fundHash = await walletClient.sendTransaction({
                to: migratorAddress,
                value: totalEthNeeded,
            });

            await publicClient.waitForTransactionReceipt({ hash: fundHash });

            console.log(`Funded migrator with ${formatEther(totalEthNeeded)} ETH (tx: ${fundHash})`);
        }

        const batchSize = 20;

        for (let i = 0; i < ethBountyIds.length; i += batchSize) {
            const batch = ethBountyIds.slice(i, i + batchSize);
            console.log(`Migrating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(ethBountyIds.length / batchSize)}...`);

            const migrateBatchHash = await walletClient.writeContract({
                address: migrator.address,
                abi: migrator.abi,
                functionName: "migrateBounties",
                args: [batch],
            });

            await publicClient.waitForTransactionReceipt({ hash: migrateBatchHash });

            console.log(`Batch ${Math.floor(i / batchSize) + 1} migration complete (tx: ${migrateBatchHash})`);
        }

        console.log("Withdrawing remaining ETH from migrator...");

        const withdrawHash = await walletClient.writeContract({
            address: migrator.address,
            abi: migrator.abi,
            functionName: "withdraw",
        });

        await publicClient.waitForTransactionReceipt({ hash: withdrawHash });

        console.log(`Withdrawal complete (tx: ${withdrawHash})`);
        console.log("Migration complete!");
    });
