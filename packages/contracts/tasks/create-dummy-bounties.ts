import "@nomicfoundation/hardhat-toolbox-viem";
import { task, types } from "hardhat/config";
import {
    Address,
    parseEther
} from 'viem';
import deploymentAddress from '../ignition/deployments/chain-31337/deployed_addresses.json';

task('create-bounties', 'This create some bounties and mark some as paid to be used in the migration task').addOptionalParam('numberOfBounties', 'The number of bounties to create', 5, types.int).addOptionalParam('numberOfPaidBounties', 'The number of paid bounties to create', 3, types.int).setAction(async (taskArgs, hre) => {
    // Ensure required environment variables are set
    const NATIVE_V1_ADDRESS = deploymentAddress["NativeV1#NativeV1Bounty"] as Address
    if (!NATIVE_V1_ADDRESS) {
        console.log("Please deploy the native v1 contract first")
        console.log("\nExample command:")
        console.log("npx hardhat ignition deploy ignition/modules/<NETWORK_NAME>/NativeV1.ts --network <NETWORK_NAME>")
        process.exit(1)
    }

    const [_, account1, account2] = await hre.viem.getWalletClients()

    const publicClient = await hre.viem.getPublicClient()

    const nativeV1Bounty = await hre.viem.getContractAt("NativeV1Bounty", NATIVE_V1_ADDRESS)

    const bountyAmount = parseEther('0.1')
    console.log("Creating new V1 bounty...")


    const NUMBER_OF_BOUNTIES = taskArgs.numberOfBounties ?? 5
    const NUMBER_OF_PAID_BOUNTIES = taskArgs.numberOfPaidBounties ?? 3
    let j = 0
    for (let i = 0; i < NUMBER_OF_BOUNTIES; i++) {
        console.log("Creating bounty #" + (i + 1))
        const createBountyTx = await nativeV1Bounty.write.createBounty([0, bountyAmount], { value: bountyAmount, account: account1.account })
        const receipt = await publicClient.waitForTransactionReceipt({ hash: createBountyTx });

        console.log("Bounty created")
        if (j < NUMBER_OF_PAID_BOUNTIES) {
            const events = await publicClient.getContractEvents({
                address: nativeV1Bounty.address,
                abi: nativeV1Bounty.abi,
                eventName: 'BountyCreated',
                fromBlock: receipt.blockNumber,
                toBlock: receipt.blockNumber
            });

            const bountyCreatedEvent = events[0];
            const bountyId = bountyCreatedEvent.args.bountyId;
            console.log("Bounty created with id: " + bountyId)

            const payTx = await nativeV1Bounty.write.payBounty([bountyId!!, account2.account.address], { account: account1.account });
            await publicClient.waitForTransactionReceipt({ hash: payTx });
            console.log("Bounty paid")
            //mine blocks
            await hre.network.provider.send('hardhat_mine', ['0x100']);
            console.log("Mined a new block")
        }
        j += 1
    }

    console.log('Bounties created')
})