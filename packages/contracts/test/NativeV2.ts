import { expect } from 'chai';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { parseEther } from 'viem';

describe('NativeV2', function () {
    async function deployNativeV2() {
        const [deployer, account1, account2] = await hre.viem.getWalletClients()
        const publicClient = await hre.viem.getPublicClient()
        const NativeV2 = await hre.viem.deployContract('NativeV2Bounty', [deployer.account.address])
        
        return { NativeV2, deployer, account1, account2, publicClient }
    }

    async function createBountyFixture() {
        const { NativeV2, deployer, account1, account2, publicClient } = await loadFixture(deployNativeV2);
        const bountyAmount = parseEther('1');

        const tx = await NativeV2.write.createBounty([bountyAmount], { value: bountyAmount, account: account1.account });
        const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
        
        const events = await publicClient.getContractEvents({
            address: NativeV2.address,
            abi: NativeV2.abi,
            eventName: 'BountyCreated',
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber
        });
        
        const bountyId = events[0].args.bountyId;
        
        return { 
            NativeV2, 
            publicClient, 
            deployer,
            account1,
            account2,
            bountyId, 
            bountyAmount 
        };
    }

    it("Should deploy", async function () {
        const { NativeV2 } = await loadFixture(deployNativeV2)
        expect(NativeV2.address).to.not.be.null
    })
    
    describe("Create Bounty", function () {
        it("should create a bounty when correct amount is sent", async function () {
            const { NativeV2, account1, publicClient } = await loadFixture(deployNativeV2)
            const bountyAmount = parseEther('1')
            const tx = await NativeV2.write.createBounty([bountyAmount], { value: bountyAmount, account: account1.account })
            const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })
        
            const events = await publicClient.getContractEvents({
                address: NativeV2.address,
                abi: NativeV2.abi,
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
            const { NativeV2, account1 } = await loadFixture(deployNativeV2)
            
            await expect(NativeV2.write.createBounty([BigInt(0)], { value: BigInt(0), account: account1.account })).to.be.rejected
        })

        it("should revert when sent ETH doesn't match bounty amount", async function () {
            const { NativeV2, account1 } = await loadFixture(deployNativeV2)
            const bountyAmount = parseEther('1')
            
            await expect(
                NativeV2.write.createBounty([bountyAmount], { value: parseEther('0.5'), account: account1.account })
            ).to.be.rejected
        })

        it('should generate unique bountyIds', async function () {
            const { NativeV2, account1, publicClient } = await loadFixture(deployNativeV2)
            const bountyAmount = parseEther("0.1")

            const tx = await NativeV2.write.createBounty([bountyAmount], { value: bountyAmount, account: account1.account })
            const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })
            const bountyId1 = (await publicClient.getContractEvents({
                address: NativeV2.address,
                abi: NativeV2.abi,
                eventName: 'BountyCreated',
                fromBlock: receipt.blockNumber,
                toBlock: receipt.blockNumber
            }))[0].args.bountyId
            expect(bountyId1).to.exist
            
            const tx2 = await NativeV2.write.createBounty([bountyAmount], { value: bountyAmount, account: account1.account })            
            const receipt2 = await publicClient.waitForTransactionReceipt({ hash: tx2 })
            const bountyId2 = (await publicClient.getContractEvents({
                address: NativeV2.address,
                abi: NativeV2.abi,
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
            const { account1, bountyId, bountyAmount, NativeV2 } = await loadFixture(createBountyFixture);
            expect(bountyId).to.exist;
            const bountyInfo = await NativeV2.read.getBountyInfo([bountyId!!]);

            expect(bountyInfo[0].toLowerCase()).to.equal(account1.account.address.toLowerCase());
            expect(bountyInfo[1]).to.equal(bountyAmount);
            expect(bountyInfo[2]).to.be.false;
        })
        
        it("should return zeroed values for a non-existent bounty ID", async function() {
            const { NativeV2 } = await loadFixture(deployNativeV2);
            const nonExistentBountyId = '0x1234567890123456789012345678901234567890123456789012345678901234';
            
            const bountyInfo = await NativeV2.read.getBountyInfo([nonExistentBountyId]);
            
            expect(bountyInfo[0]).to.equal('0x0000000000000000000000000000000000000000'); 
            expect(bountyInfo[1]).to.equal(0n); 
            expect(bountyInfo[2]).to.be.false; 
        });
    })

    describe("Pay Bounty", function () {
        it("should allow creator to pay bounty to winner", async function () {
            const { NativeV2, account1, account2, publicClient, bountyId, bountyAmount } = await loadFixture(createBountyFixture);

        
            const account2Balance = await publicClient.getBalance({ address: account2.account.address });

            expect(bountyId).to.exist;
            const payTx = await NativeV2.write.payBounty([bountyId!!, account2.account.address], { account: account1.account });
            const payReceipt = await publicClient.waitForTransactionReceipt({ hash: payTx });

            const payEvents = await publicClient.getContractEvents({
                address: NativeV2.address,
                abi: NativeV2.abi,
                eventName: "BountyPaid",
                fromBlock: payReceipt.blockNumber,
                toBlock: payReceipt.blockNumber
            });
            
            expect(payEvents.length).to.equal(1);
            expect(payEvents[0].args.winner?.toLowerCase()).to.equal(account2.account.address.toLowerCase());
            expect(payEvents[0].args.amount).to.equal(bountyAmount);

        
            const bountyInfo = await NativeV2.read.getBountyInfo([bountyId!!]);
            expect(bountyInfo[2]).to.be.true;

        
            const finalAccount2Balance = await publicClient.getBalance({ address: account2.account.address });
            expect(finalAccount2Balance - account2Balance).to.equal(bountyAmount);
        });

        it('should revert when non-creator tries to pay', async function () {
            const { NativeV2, account2, bountyId } = await loadFixture(createBountyFixture);
            expect(bountyId).to.exist;

            await expect(
                NativeV2.write.payBounty([bountyId!!, account2.account.address], { account: account2.account })
            ).to.be.rejected;
        });

        it("should revert when attempting to pay already paid bounty", async function() {
            const { NativeV2, account1, account2, bountyId } = await loadFixture(createBountyFixture);
            expect(bountyId).to.exist;
            
        
            await NativeV2.write.payBounty(
                [bountyId!!, account2.account.address],
                { account: account1.account }
            );
            
        
            await expect(
                NativeV2.write.payBounty(
                    [bountyId!!, account2.account.address],
                    { account: account1.account }
                )
            ).to.be.rejected
        });
        
        it("should revert when attempting to pay invalid bounty", async function() {
            const { NativeV2, account1, account2 } = await loadFixture(deployNativeV2);
            
            const invalidBountyId = '0x1234567890123456789012345678901234567890123456789012345678901234';

            await expect(
                NativeV2.write.payBounty(
                    [invalidBountyId, account2.account.address],
                    { account: account1.account }
                )
            ).to.be.rejected;
        });
    });

    describe("withdraw", function () {
        it("should allow owner to withdraw eth", async function () {
            const { NativeV2, deployer, account2, publicClient, bountyAmount } = await loadFixture(createBountyFixture);
            
        
            const contractBalanceAfterBountyCreation = await publicClient.getBalance({ address: NativeV2.address });
            
        
            const account2BalanceBefore = await publicClient.getBalance({ address: account2.account.address });

        
            const withdrawTx = await NativeV2.write.withdraw([bountyAmount, account2.account.address], { account: deployer.account });
            await publicClient.waitForTransactionReceipt({ hash: withdrawTx });

        
            const account2BalanceAfter = await publicClient.getBalance({ address: account2.account.address });
            const contractBalanceAfterWithdrawing = await publicClient.getBalance({ address: NativeV2.address });

            expect(account2BalanceAfter - account2BalanceBefore).to.equal(bountyAmount);
            expect(contractBalanceAfterWithdrawing).to.equal(contractBalanceAfterBountyCreation - bountyAmount);
        });

        it('should revert when non-owner tries to withdraw', async function () {
            const { NativeV2, account1, account2, bountyAmount } = await loadFixture(createBountyFixture);

            await expect(
                NativeV2.write.withdraw([bountyAmount, account2.account.address], { account: account2.account })
            ).to.be.rejected;
        });

        it('should revert when trying to withdraw more than contract balance', async function () {
            const { NativeV2, deployer, account2 } = await loadFixture(createBountyFixture);
            const tooMuchAmount = parseEther('100'); 

            await expect(
                NativeV2.write.withdraw([tooMuchAmount, account2.account.address], { account: deployer.account })
            ).to.be.rejected;
        });
    });
});