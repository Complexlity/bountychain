import { expect } from 'chai';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { parseEther } from 'viem';

describe('Native_v2', function () {
    async function deployNative_v2() {
        const [deployer, account1, account2] = await hre.viem.getWalletClients()
        const publicClient = await hre.viem.getPublicClient()
        const Native_v2 = await hre.viem.deployContract('Native_v2', [deployer.account.address])
        
        return { Native_v2, deployer, account1, account2, publicClient }
    }

    // Fixture for creating a bounty
    async function createBountyFixture() {
        const { Native_v2, deployer, account1, account2, publicClient } = await loadFixture(deployNative_v2);
        const bountyAmount = parseEther('1');

        const tx = await Native_v2.write.createBounty([bountyAmount], { value: bountyAmount, account: account1.account });
        const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
        
        // Get bounty ID from event
        const events = await publicClient.getContractEvents({
            address: Native_v2.address,
            abi: Native_v2.abi,
            eventName: 'BountyCreated',
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber
        });
        
        const bountyId = events[0].args.bountyId;
        
        return { 
            Native_v2, 
            publicClient, 
            deployer,
            account1,
            account2,
            bountyId, 
            bountyAmount 
        };
    }

    it("Should deploy", async function () {
        const { Native_v2 } = await loadFixture(deployNative_v2)
        expect(Native_v2.address).to.not.be.null
    })
    
    describe("Create Bounty", function () {
        it("should create a bounty when correct amount is sent", async function () {
            const { Native_v2, account1, publicClient } = await loadFixture(deployNative_v2)
            const bountyAmount = parseEther('1')
            const tx = await Native_v2.write.createBounty([bountyAmount], { value: bountyAmount, account: account1.account })
            const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })
        
            //Verify events was emitted
            const events = await publicClient.getContractEvents({
                address: Native_v2.address,
                abi: Native_v2.abi,
                eventName: 'BountyCreated',
                fromBlock: receipt.blockNumber,
                toBlock: receipt.blockNumber
            })
        
            expect(events.length).to.equal(1)
            expect(events[0].args.creator?.toLowerCase()).to.equal(account1.account.address.toLowerCase())
            expect(events[0].args.amount).to.equal(bountyAmount)
            expect(events[0].args.bountyId).to.exist
        })

        it("should revert when bounty amount is 0", async function () {
            const { Native_v2, account1 } = await loadFixture(deployNative_v2)
            
            await expect(Native_v2.write.createBounty([BigInt(0)], { value: BigInt(0), account: account1.account })).to.be.rejected
        })

        it("should revert when sent ETH doesn't match bounty amount", async function () {
            const { Native_v2, account1 } = await loadFixture(deployNative_v2)
            const bountyAmount = parseEther('1')
            
            await expect(
                Native_v2.write.createBounty([bountyAmount], { value: parseEther('0.5'), account: account1.account })
            ).to.be.rejected
        })

        it('should generate unique bountyIds', async function () {
            const { Native_v2, account1, publicClient } = await loadFixture(deployNative_v2)
            const bountyAmount = parseEther("0.1")

            //First bounty
            const tx = await Native_v2.write.createBounty([bountyAmount], { value: bountyAmount, account: account1.account })
            const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })
            const bountyId1 = (await publicClient.getContractEvents({
                address: Native_v2.address,
                abi: Native_v2.abi,
                eventName: 'BountyCreated',
                fromBlock: receipt.blockNumber,
                toBlock: receipt.blockNumber
            }))[0].args.bountyId
            expect(bountyId1).to.exist
            
            //Second bounty
            const tx2 = await Native_v2.write.createBounty([bountyAmount], { value: bountyAmount, account: account1.account })            
            const receipt2 = await publicClient.waitForTransactionReceipt({ hash: tx2 })
            const bountyId2 = (await publicClient.getContractEvents({
                address: Native_v2.address,
                abi: Native_v2.abi,
                eventName: 'BountyCreated',
                fromBlock: receipt2.blockNumber,
                toBlock: receipt2.blockNumber
            }))[0].args.bountyId
            expect(bountyId2).to.exist
            expect(bountyId2).to.not.equal(bountyId1)
        })        
    })

    describe("Get Bounty Info", function () {
        it("should return correct bounty information", async function () {
            const { account1, bountyId, bountyAmount, Native_v2 } = await loadFixture(createBountyFixture);
            expect(bountyId).to.exist;
            const bountyInfo = await Native_v2.read.getBountyInfo([bountyId!!]);

            expect(bountyInfo[0].toLowerCase()).to.equal(account1.account.address.toLowerCase()); // creator
            expect(bountyInfo[1]).to.equal(bountyAmount); // amount
            expect(bountyInfo[2]).to.be.false; // isPaid
        })
        
        it("should return zeroed values for a non-existent bounty ID", async function() {
            const { Native_v2 } = await loadFixture(deployNative_v2);
            const nonExistentBountyId = '0x1234567890123456789012345678901234567890123456789012345678901234';
            
            const bountyInfo = await Native_v2.read.getBountyInfo([nonExistentBountyId]);
            
            expect(bountyInfo[0]).to.equal('0x0000000000000000000000000000000000000000'); // default address
            expect(bountyInfo[1]).to.equal(0n); // default uint256
            expect(bountyInfo[2]).to.be.false; // default bool
        });
    })

    describe("Pay Bounty", function () {
        it("should allow creator to pay bounty to winner", async function () {
            const { Native_v2, account1, account2, publicClient, bountyId, bountyAmount } = await loadFixture(createBountyFixture);

            // Get current balance of account 2
            const account2Balance = await publicClient.getBalance({ address: account2.account.address });

            expect(bountyId).to.exist;
            const payTx = await Native_v2.write.payBounty([bountyId!!, account2.account.address], { account: account1.account });
            const payReceipt = await publicClient.waitForTransactionReceipt({ hash: payTx });

            const payEvents = await publicClient.getContractEvents({
                address: Native_v2.address,
                abi: Native_v2.abi,
                eventName: "BountyPaid",
                fromBlock: payReceipt.blockNumber,
                toBlock: payReceipt.blockNumber
            });
            
            expect(payEvents.length).to.equal(1);
            expect(payEvents[0].args.winner?.toLowerCase()).to.equal(account2.account.address.toLowerCase());
            expect(payEvents[0].args.amount).to.equal(bountyAmount);

            // Verify bounty info changes to paid
            const bountyInfo = await Native_v2.read.getBountyInfo([bountyId!!]);
            expect(bountyInfo[2]).to.be.true; // isPaid

            // Verify Winner received the ETH
            const finalAccount2Balance = await publicClient.getBalance({ address: account2.account.address });
            expect(finalAccount2Balance - account2Balance).to.equal(bountyAmount);
        });

        it('should revert when non-creator tries to pay', async function () {
            const { Native_v2, account2, bountyId } = await loadFixture(createBountyFixture);
            expect(bountyId).to.exist;

            await expect(
                Native_v2.write.payBounty([bountyId!!, account2.account.address], { account: account2.account })
            ).to.be.rejected;
        });

        it("should revert when attempting to pay already paid bounty", async function() {
            const { Native_v2, account1, account2, bountyId } = await loadFixture(createBountyFixture);
            expect(bountyId).to.exist;
            
            // Pay bounty first time
            await Native_v2.write.payBounty(
                [bountyId!!, account2.account.address],
                { account: account1.account }
            );
            
            // Attempt to pay again
            await expect(
                Native_v2.write.payBounty(
                    [bountyId!!, account2.account.address],
                    { account: account1.account }
                )
            ).to.be.rejectedWith("Bounty has already been paid");
        });
        
        it("should revert when attempting to pay invalid bounty", async function() {
            const { Native_v2, account1, account2 } = await loadFixture(deployNative_v2);
            
            const invalidBountyId = '0x1234567890123456789012345678901234567890123456789012345678901234';

            await expect(
                Native_v2.write.payBounty(
                    [invalidBountyId, account2.account.address],
                    { account: account1.account }
                )
            ).to.be.rejected;
        });
    });

    describe("withdraw", function () {
        it("should allow owner to withdraw eth", async function () {
            const { Native_v2, deployer, account2, publicClient, bountyAmount } = await loadFixture(createBountyFixture);
            
            // Get balance of contract after sending
            const contractBalanceAfterBountyCreation = await publicClient.getBalance({ address: Native_v2.address });
            
            // Get balance of account2 before withdrawing
            const account2BalanceBefore = await publicClient.getBalance({ address: account2.account.address });

            // Withdraw eth
            const withdrawTx = await Native_v2.write.withdraw([bountyAmount, account2.account.address], { account: deployer.account });
            await publicClient.waitForTransactionReceipt({ hash: withdrawTx });

            // Get balance of account2 after withdrawing
            const account2BalanceAfter = await publicClient.getBalance({ address: account2.account.address });
            const contractBalanceAfterWithdrawing = await publicClient.getBalance({ address: Native_v2.address });

            expect(account2BalanceAfter - account2BalanceBefore).to.equal(bountyAmount);
            expect(contractBalanceAfterWithdrawing).to.equal(contractBalanceAfterBountyCreation - bountyAmount);
        });

        it('should revert when non-owner tries to withdraw', async function () {
            const { Native_v2, account1, account2, bountyAmount } = await loadFixture(createBountyFixture);

            await expect(
                Native_v2.write.withdraw([bountyAmount, account2.account.address], { account: account2.account })
            ).to.be.rejected;
        });

        it('should revert when trying to withdraw more than contract balance', async function () {
            const { Native_v2, deployer, account2 } = await loadFixture(createBountyFixture);
            const tooMuchAmount = parseEther('100'); // Much more than the contract has

            await expect(
                Native_v2.write.withdraw([tooMuchAmount, account2.account.address], { account: deployer.account })
            ).to.be.rejected;
        });
    });
});