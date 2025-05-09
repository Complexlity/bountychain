import { expect } from 'chai';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { parseEther } from 'viem';

describe('NativeV1', function () {
    async function deployNativeV1Contract() {
        const [deployer, account1, account2] = await hre.viem.getWalletClients()
        const publicClient = await hre.viem.getPublicClient()
        const UsdcContract = await hre.viem.deployContract('UsdcMock')

        await UsdcContract.write.mint([deployer.account.address, parseEther('1000')])
        await UsdcContract.write.mint([account1.account.address, parseEther('1000')])
        const NativeV1Contract = await hre.viem.deployContract('NativeV1Bounty', [deployer.account.address, UsdcContract.address])
       

        
        return { NativeV1Contract, UsdcContract, deployer, account1, account2, publicClient }
    }

        async function createBountyFixture() {
        const { NativeV1Contract, UsdcContract, deployer, account1, account2, publicClient } = await loadFixture(deployNativeV1Contract);
        const bountyAmount = parseEther('1');
        const tokenType = 0
        
        let tx = await NativeV1Contract.write.createBounty([tokenType, bountyAmount], { value: bountyAmount, account: account1.account });
        const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
        
            const events = await publicClient.getContractEvents({
            address: NativeV1Contract.address,
            abi: NativeV1Contract.abi,
            eventName: 'BountyCreated',
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber
        });
        
        const bountyId = events[0].args.bountyId;
        
        return { 
            NativeV1Contract, 
            UsdcContract, 
            publicClient, 
            deployer,
            account1,
            account2,
            bountyId, 
            bountyAmount 
        };
    }

        async function createUsdcBountyFixture() {
        const { NativeV1Contract, UsdcContract, deployer, account1, account2, publicClient } = await loadFixture(deployNativeV1Contract); 
        const bountyAmount = parseEther('1');
        const tokenType = 1

        await UsdcContract.write.approve([NativeV1Contract.address, bountyAmount], { account: account1.account });
        const tx = await NativeV1Contract.write.createBounty([tokenType, bountyAmount], { account: account1.account });

        const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
        
        const events = await publicClient.getContractEvents({
            address: NativeV1Contract.address,
            abi: NativeV1Contract.abi,
            eventName: 'BountyCreated',
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber
        });
        
        const bountyId = events[0].args.bountyId;
        
        return { 
            NativeV1Contract, 
            UsdcContract, 
            publicClient, 
            deployer,
            account1,
            account2,
            bountyId, 
            bountyAmount 
        };
    }

    it("Should deploy", async function () {
        const { NativeV1Contract } = await loadFixture(deployNativeV1Contract)
        expect(NativeV1Contract.address).to.not.be.null
    })

    it("Should give accounts the correct amount of usdc", async function () {
        const { UsdcContract, deployer: deployer } = await loadFixture(deployNativeV1Contract)
        const deployerBalance = await UsdcContract.read.balanceOf([deployer.account.address])
        const account1Balance = await UsdcContract.read.balanceOf([deployer.account.address])
        expect(deployerBalance).to.equal(parseEther('1000'))
        expect(account1Balance).to.equal(parseEther('1000'))
    })
    
    describe("Create Bounty", function () {
        it("should create an ETH bounty when correct amount is sent", async function () {
            const { NativeV1Contract, account1: account1, publicClient } = await loadFixture(deployNativeV1Contract)
            const bountyAmount = parseEther('1')
            const tx = await NativeV1Contract.write.createBounty([0, bountyAmount], { value: bountyAmount, account: account1.account })
            const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })
        

            const events = await publicClient.getContractEvents({
                address: NativeV1Contract.address,
                abi: NativeV1Contract.abi,
                eventName: 'BountyCreated',
                fromBlock: (receipt).blockNumber,
                toBlock: receipt.blockNumber
            })
        
            expect(events.length).to.equal(1)
            expect(events[0].args.creator?.toLowerCase()).to.equal(account1.account.address.toLowerCase())
            expect(events[0].args.amount).to.equal(bountyAmount)
            expect(events[0].args.tokenType).to.equal(0)
            expect(events[0].args.bountyId).to.exist
        })

        it("should create a USDC bounty", async function () {
            const { NativeV1Contract, account1: account1, publicClient, UsdcContract } = await loadFixture(deployNativeV1Contract)
            const bountyAmount = parseEther('10')
            await UsdcContract.write.approve([NativeV1Contract.address, bountyAmount], { account: account1.account })
            const tx = await NativeV1Contract.write.createBounty([1, bountyAmount], { account: account1.account })
            const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })

            const events = await publicClient.getContractEvents({
                address: NativeV1Contract.address,
                abi: NativeV1Contract.abi,
                eventName: 'BountyCreated',
                fromBlock: (receipt).blockNumber,
                toBlock: receipt.blockNumber
            })

            expect(events.length).to.equal(1)
            expect(events[0].args.creator?.toLowerCase()).to.equal(account1.account.address.toLowerCase())
            expect(events[0].args.amount).to.equal(bountyAmount)
            expect(events[0].args.tokenType).to.equal(1)
            expect(events[0].args.bountyId).to.exist
        })

        it("should revert when bounty amount is 0", async function () {
            const { NativeV1Contract, account1: account1 } = await loadFixture(deployNativeV1Contract)
            
            await expect(NativeV1Contract.write.createBounty([0, BigInt(0)], { value: BigInt(0), account: account1.account })).to.be.rejected
        })

        it("should revert when token type is invalid", async function () {
            const { NativeV1Contract, account1: account1 } = await loadFixture(deployNativeV1Contract)

            await expect(NativeV1Contract.write.createBounty([2, BigInt(parseEther("0.01"))], { value: BigInt(0), account: account1.account })).to.be.rejected
        })

        it("should revert when using USDC but ETH is also sent", async function () {
            const { NativeV1Contract, account1: account1 } = await loadFixture(deployNativeV1Contract)
            const bountyAmount = parseEther('10')
            
            await expect(
                NativeV1Contract.write.createBounty([1, bountyAmount], { value: parseEther('0.1'), account: account1.account })
            ).to.be.rejected
        })

        it('should revert when USDC transfer fails', async function () {
            const { NativeV1Contract, account1: account1, UsdcContract } = await loadFixture(deployNativeV1Contract)
            const bountyAmount = parseEther('0.1')
            await expect(
                NativeV1Contract.write.createBounty([1, bountyAmount], { account: account1.account })
            ).to.be.rejected
        })

        it('should generate unique bountyIds', async function () {
            const { NativeV1Contract, account1: account1, publicClient } = await loadFixture(deployNativeV1Contract)
            const bountyAmount = parseEther("0.1")


            const tx = await NativeV1Contract.write.createBounty([0, bountyAmount], { value: bountyAmount, account: account1.account })
            const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })
            const bountyId1 = (await publicClient.getContractEvents({
                address: NativeV1Contract.address,
                abi: NativeV1Contract.abi,
                eventName: 'BountyCreated',
                fromBlock: (receipt).blockNumber,
                toBlock: receipt.blockNumber
            }))[0].args.bountyId
            expect(bountyId1).to.exist
            

            const tx2 = await NativeV1Contract.write.createBounty([0, bountyAmount], { value: bountyAmount, account: account1.account })            
            const receipt2 = await publicClient.waitForTransactionReceipt({ hash: tx2 })
            const bountyId2 = (await publicClient.getContractEvents({
                address: NativeV1Contract.address,
                abi: NativeV1Contract.abi,
                eventName: 'BountyCreated',
                fromBlock: (receipt2).blockNumber,
                toBlock: receipt2.blockNumber
            }))[0].args.bountyId
            expect(bountyId2).to.exist
            expect(bountyId2).to.not.equal(bountyId1)
        })        
    })

    describe("Get Bounty Info", function () {
        it("should return correct bounty information", async function () {
            const { account1, bountyId, bountyAmount, NativeV1Contract } = await loadFixture(createBountyFixture);
            expect(bountyId).to.exist;
            const bountyInfo = await NativeV1Contract.read.getBountyInfo([bountyId!!]);

            })

        it("should return correct information for a USDC bounty", async function() {
            const { account1, bountyId, bountyAmount, NativeV1Contract } = await loadFixture(createUsdcBountyFixture);
            
                expect(bountyId).to.exist;
            const bountyInfo = await NativeV1Contract.read.getBountyInfo([bountyId!!]);
            
            });
        
        it("should return zeroed values for a non-existent bounty ID", async function() {
            const { NativeV1Contract } = await loadFixture(deployNativeV1Contract);
            const nonExistentBountyId = '0x1234567890123456789012345678901234567890123456789012345678901234';
            
            const bountyInfo = await NativeV1Contract.read.getBountyInfo([nonExistentBountyId]);
            
              });
    })

    describe("Pay Bounty", function () {
        it("should allow creator pay eth to winner", async function () {
            const { NativeV1Contract, account1, account2, publicClient, bountyId, bountyAmount } = await loadFixture(createBountyFixture);

                const account2Balance = await publicClient.getBalance({ address: account2.account.address });

            expect(bountyId).to.exist;
            const payTx = await NativeV1Contract.write.payBounty([bountyId!!, account2.account.address], { account: account1.account });
            const payReceipt = await publicClient.waitForTransactionReceipt({ hash: payTx });

            const payEvents = await publicClient.getContractEvents({
                address: NativeV1Contract.address,
                abi: NativeV1Contract.abi,
                eventName: "BountyPaid",
                fromBlock: payReceipt.blockNumber,
                toBlock: payReceipt.blockNumber
            });
            
            expect(payEvents.length).to.equal(1);
            expect(payEvents[0].args.winner?.toString().toLowerCase()).to.equal(account2.account.address.toLowerCase());
            expect(payEvents[0].args.amount).to.equal(bountyAmount);
            expect(payEvents[0].args.tokenType).to.equal(0);

                const bountyInfo = await NativeV1Contract.read.getBountyInfo([bountyId!!]);

                const finalAccount2Balance = await publicClient.getBalance({ address: account2.account.address });
            expect(finalAccount2Balance - account2Balance).to.equal(bountyAmount);
        });

        it("should allow creator pay usdc to winner", async function () {
            const { NativeV1Contract, account1, account2, publicClient, UsdcContract, bountyId, bountyAmount } = await loadFixture(createUsdcBountyFixture);

                const account2Balance = await UsdcContract.read.balanceOf([account2.account.address]);
            
            const payTx = await NativeV1Contract.write.payBounty([bountyId!!, account2.account.address], { account: account1.account });
            const payReceipt = await publicClient.waitForTransactionReceipt({ hash: payTx });
            
            const payEvents = await publicClient.getContractEvents({
                address: NativeV1Contract.address,
                abi: NativeV1Contract.abi,
                eventName: "BountyPaid",
                fromBlock: payReceipt.blockNumber,
                toBlock: payReceipt.blockNumber
            });
            
            expect(payEvents.length).to.equal(1);
            expect(payEvents[0].args.winner?.toString().toLowerCase()).to.equal(account2.account.address.toLowerCase());
            expect(payEvents[0].args.amount).to.equal(bountyAmount);
            expect(payEvents[0].args.tokenType).to.equal(1);

                expect(bountyId).to.exist;
            const bountyInfo = await NativeV1Contract.read.getBountyInfo([bountyId!!]);

                const finalAccount2Balance = await UsdcContract.read.balanceOf([account2.account.address]);
            expect(finalAccount2Balance - account2Balance).to.equal(bountyAmount);
        });

        it('should revert when non-creator tries to pay', async function () {
            const { NativeV1Contract, account1, account2, bountyId } = await loadFixture(createBountyFixture);
            expect(bountyId).to.exist;

            await expect(
                NativeV1Contract.write.payBounty([bountyId!!, account2.account.address], { account: account2.account })
            ).to.be.rejected;
        });

        it("should revert when attempting to pay already paid bounty", async function() {
            const { NativeV1Contract, account1, account2, bountyId } = await loadFixture(createBountyFixture);
            expect(bountyId).to.exist;
            
                await NativeV1Contract.write.payBounty(
                [bountyId!!, account2.account.address],
                { account: account1.account }
            );
            
                await expect(
                NativeV1Contract.write.payBounty(
                    [bountyId!!, account2.account.address],
                    { account: account1.account }
                )
            ).to.be.rejected
        });
        
        it("should revert when attempting to pay invalid bounty", async function() {
            const { NativeV1Contract, account1, account2 } = await loadFixture(deployNativeV1Contract);
            
            const invalidBountyId = '0x1234567890123456789012345678901234567890123456789012345678901234';

            await expect(
                NativeV1Contract.write.payBounty(
                    [invalidBountyId, account2.account.address],
                    { account: account1.account }
                )
            ).to.be.rejected;
        });
    });

    describe("withdraw", function () {
        it("should allow owner to withdraw eth", async function () {
            const { NativeV1Contract, deployer, account2, publicClient, bountyId, bountyAmount } = await loadFixture(createBountyFixture);
            
                const contractBalanceAfterBountyCreation = await publicClient.getBalance({ address: NativeV1Contract.address });
            
                const account2BalanceBefore = await publicClient.getBalance({ address: account2.account.address });

                const withdrawTx = await NativeV1Contract.write.withdraw([bountyAmount, 0, account2.account.address], { account: deployer.account });
            await publicClient.waitForTransactionReceipt({ hash: withdrawTx });

                const account2BalanceAfter = await publicClient.getBalance({ address: account2.account.address });
            const contractBalanceAfterWithdrawing = await publicClient.getBalance({ address: NativeV1Contract.address });

            expect(account2BalanceAfter - account2BalanceBefore).to.equal(bountyAmount);
            expect(contractBalanceAfterWithdrawing).to.equal(contractBalanceAfterBountyCreation - bountyAmount);
        });

        it("should allow owner to withdraw usdc", async function () {
            const { NativeV1Contract, deployer, account2, publicClient, UsdcContract, bountyId, bountyAmount } = await loadFixture(createUsdcBountyFixture);
            
                const contractBalanceAfterBountyCreation = await UsdcContract.read.balanceOf([NativeV1Contract.address]);
            
                const account2BalanceBefore = await UsdcContract.read.balanceOf([account2.account.address]);
            
                const withdrawTx = await NativeV1Contract.write.withdraw([bountyAmount, 1, account2.account.address], { account: deployer.account });
            await publicClient.waitForTransactionReceipt({ hash: withdrawTx });

                const account2BalanceAfter = await UsdcContract.read.balanceOf([account2.account.address]);
            const contractBalanceAfterWithdrawing = await UsdcContract.read.balanceOf([NativeV1Contract.address]);            

            expect(account2BalanceAfter - account2BalanceBefore).to.equal(bountyAmount);
            expect(contractBalanceAfterWithdrawing).to.equal(contractBalanceAfterBountyCreation - bountyAmount);
        });

        it('should revert when non-owner tries to withdraw', async function () {
            const { NativeV1Contract, account1, account2, bountyAmount } = await loadFixture(createBountyFixture);

            await expect(
                NativeV1Contract.write.withdraw([bountyAmount, 0, account2.account.address], { account: account2.account })
            ).to.be.rejected;
        });
    });
});