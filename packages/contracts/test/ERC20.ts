import { expect } from 'chai';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { parseEther } from 'viem';

describe('ERC20Bounty', function () {
    async function deployErc20V2Contract() {
        const [deployer, account1, account2] = await hre.viem.getWalletClients();
        const publicClient = await hre.viem.getPublicClient();
        
        const MockUsdcToken = await hre.viem.deployContract('UsdcMock');
        
        await MockUsdcToken.write.mint([deployer.account.address, parseEther('1000')]);
        await MockUsdcToken.write.mint([account1.account.address, parseEther('1000')]);
        
        const Erc20V2Contract = await hre.viem.deployContract('ERC20Bounty', [
            deployer.account.address,
            MockUsdcToken.address
        ]);
        
        return { Erc20V2Contract, MockUsdcToken, deployer, account1, account2, publicClient };
    }

    async function createBountyFixture() {
        const { Erc20V2Contract, MockUsdcToken: MockToken, deployer, account1, account2, publicClient } = await loadFixture(deployErc20V2Contract);
        const bountyAmount = parseEther('1');

        await MockToken.write.approve([Erc20V2Contract.address, bountyAmount], { account: account1.account });
        
        const tx = await Erc20V2Contract.write.createBounty([bountyAmount], { account: account1.account });
        const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
        
        const events = await publicClient.getContractEvents({
            address: Erc20V2Contract.address,
            abi: Erc20V2Contract.abi,
            eventName: 'BountyCreated',
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber
        });
        
        const bountyId = events[0].args.bountyId;
        
        return { 
            Erc20V2Contract, 
            MockToken,
            publicClient, 
            deployer,
            account1,
            account2,
            bountyId, 
            bountyAmount 
        };
    }

    it("Should deploy with correct token info", async function () {
        const { Erc20V2Contract, MockUsdcToken } = await loadFixture(deployErc20V2Contract);
        expect(Erc20V2Contract.address).to.not.be.null;
        
        const tokenAddress = await Erc20V2Contract.read.token();
        const decimals = await Erc20V2Contract.read.decimals();
        const symbol = await Erc20V2Contract.read.symbol();
        
        expect(tokenAddress.toLowerCase()).to.equal(MockUsdcToken.address.toLowerCase());
        expect(decimals).to.equal(18);
        expect(symbol).to.equal('USDC');
    });
    
    describe("Create Bounty", function () {
        it("should create a bounty when tokens are approved", async function () {
            const { Erc20V2Contract, MockUsdcToken: MockToken, account1, publicClient } = await loadFixture(deployErc20V2Contract);
            const bountyAmount = parseEther('1');
            
            await MockToken.write.approve([Erc20V2Contract.address, bountyAmount], { account: account1.account });
            
            const tx = await Erc20V2Contract.write.createBounty([bountyAmount], { account: account1.account });
            const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
        
            const events = await publicClient.getContractEvents({
                address: Erc20V2Contract.address,
                abi: Erc20V2Contract.abi,
                eventName: 'BountyCreated',
                fromBlock: receipt.blockNumber,
                toBlock: receipt.blockNumber
            });
        
            expect(events.length).to.equal(1);
            expect(events[0].args.creator?.toLowerCase()).to.equal(account1.account.address.toLowerCase());
            expect(events[0].args.amount).to.equal(bountyAmount);
            expect(events[0].args.bountyId).to.exist;

            const contractBalance = await MockToken.read.balanceOf([Erc20V2Contract.address]);
            expect(contractBalance).to.equal(bountyAmount);
        });

        it("should revert when bounty amount is 0", async function () {
            const { Erc20V2Contract, account1 } = await loadFixture(deployErc20V2Contract);
            
            await expect(
                Erc20V2Contract.write.createBounty([BigInt(0)], { account: account1.account })
            ).to.be.rejected;
        });

        it("should revert when tokens are not approved", async function () {
            const { Erc20V2Contract: Erc20V2Contract, account1 } = await loadFixture(deployErc20V2Contract);
            const bountyAmount = parseEther('1');
            
            await expect(
                Erc20V2Contract.write.createBounty([bountyAmount], { account: account1.account })
            ).to.be.rejected;
        });

        it('should generate unique bountyIds', async function () {
            const { Erc20V2Contract, MockUsdcToken: MockToken, account1, publicClient } = await loadFixture(deployErc20V2Contract);
            const bountyAmount = parseEther("0.1");

            await MockToken.write.approve([Erc20V2Contract.address, bountyAmount * 2n], { account: account1.account });

            const tx = await Erc20V2Contract.write.createBounty([bountyAmount], { account: account1.account });
            const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
            const bountyId1 = (await publicClient.getContractEvents({
                address: Erc20V2Contract.address,
                abi: Erc20V2Contract.abi,
                eventName: 'BountyCreated',
                fromBlock: receipt.blockNumber,
                toBlock: receipt.blockNumber
            }))[0].args.bountyId;
            expect(bountyId1).to.exist;
            
            const tx2 = await Erc20V2Contract.write.createBounty([bountyAmount], { account: account1.account });            
            const receipt2 = await publicClient.waitForTransactionReceipt({ hash: tx2 });
            const bountyId2 = (await publicClient.getContractEvents({
                address: Erc20V2Contract.address,
                abi: Erc20V2Contract.abi,
                eventName: 'BountyCreated',
                fromBlock: receipt2.blockNumber,
                toBlock: receipt2.blockNumber
            }))[0].args.bountyId;
            expect(bountyId2).to.exist;
            expect(bountyId2).to.not.equal(bountyId1);
        });        
    });

    describe("Get Bounty Info", function () {
        it("should return correct bounty information", async function () {
            const { account1, bountyId, bountyAmount,  Erc20V2Contract } = await loadFixture(createBountyFixture);
            expect(bountyId).to.exist;
            const bountyInfo = await Erc20V2Contract.read.getBountyInfo([bountyId!!]);

            expect(bountyInfo[0].toLowerCase()).to.equal(account1.account.address.toLowerCase()); 
            expect(bountyInfo[1]).to.equal(bountyAmount); 
            expect(bountyInfo[2]).to.be.false; 
        });
        
        it("should return zeroed values for a non-existent bounty ID", async function() {
            const { Erc20V2Contract } = await loadFixture(deployErc20V2Contract);
            const nonExistentBountyId = '0x1234567890123456789012345678901234567890123456789012345678901234';
            
            const bountyInfo = await Erc20V2Contract.read.getBountyInfo([nonExistentBountyId]);
            
            expect(bountyInfo[0]).to.equal('0x0000000000000000000000000000000000000000'); 
            expect(bountyInfo[1]).to.equal(0n); 
            expect(bountyInfo[2]).to.be.false; 
        });
    });

    describe("Pay Bounty", function () {
        it("should allow creator to pay bounty to winner", async function () {
            const { Erc20V2Contract, MockToken, account1, account2, bountyId, bountyAmount, publicClient } = await loadFixture(createBountyFixture);

            const account2Balance = await MockToken.read.balanceOf([account2.account.address]) 

            expect(bountyId).to.exist;
            const payTx = await Erc20V2Contract.write.payBounty([bountyId!!, account2.account.address], { account: account1.account });
            const payReceipt = await publicClient.waitForTransactionReceipt({ hash: payTx });

            const payEvents = await publicClient.getContractEvents({
                address: Erc20V2Contract.address,
                abi: Erc20V2Contract.abi,
                eventName: "BountyPaid",
                fromBlock: payReceipt.blockNumber,
                toBlock: payReceipt.blockNumber
            });
            
            expect(payEvents.length).to.equal(1);
            expect(payEvents[0].args.winner?.toLowerCase()).to.equal(account2.account.address.toLowerCase());
            expect(payEvents[0].args.amount).to.equal(bountyAmount);

            const bountyInfo = await Erc20V2Contract.read.getBountyInfo([bountyId!!]);
            expect(bountyInfo[2]).to.be.true; 

            const finalAccount2Balance = await MockToken.read.balanceOf([account2.account.address]) 
            expect(finalAccount2Balance - account2Balance).to.equal(bountyAmount);
        });

        it('should revert when non-creator tries to pay', async function () {
            const { Erc20V2Contract, account2, bountyId } = await loadFixture(createBountyFixture);
            expect(bountyId).to.exist;

            await expect(
                Erc20V2Contract.write.payBounty([bountyId!!, account2.account.address], { account: account2.account })
            ).to.be.rejected;
        });

        it("should revert when attempting to pay already paid bounty", async function() {
            const { Erc20V2Contract, account1, account2, bountyId } = await loadFixture(createBountyFixture);
            expect(bountyId).to.exist;
            
            await Erc20V2Contract.write.payBounty(
                [bountyId!!, account2.account.address],
                { account: account1.account }
            );
            
            await expect(
                Erc20V2Contract.write.payBounty(
                    [bountyId!!, account2.account.address],
                    { account: account1.account }
                )
            ).to.be.rejected
        });
        
        it("should revert when attempting to pay invalid bounty", async function() {
            const { Erc20V2Contract: Erc20V2Contract, account1, account2 } = await loadFixture(deployErc20V2Contract);
            
            const invalidBountyId = '0x1234567890123456789012345678901234567890123456789012345678901234';

            await expect(
                Erc20V2Contract.write.payBounty(
                    [invalidBountyId, account2.account.address],
                    { account: account1.account }
                )
            ).to.be.rejected;
        });
    });

    describe("withdraw", function () {
        it("should allow owner to withdraw tokens", async function () {
            const { Erc20V2Contract: Erc20V2Contract, MockToken, deployer, account2, bountyAmount, publicClient } = await loadFixture(createBountyFixture);
            
            const contractBalanceAfterBountyCreation = await MockToken.read.balanceOf([Erc20V2Contract.address])
            
            const account2BalanceBefore = await MockToken.read.balanceOf([account2.account.address]) 

            const withdrawTx = await Erc20V2Contract.write.withdraw([bountyAmount, account2.account.address], { account: deployer.account });
            await publicClient.waitForTransactionReceipt({ hash: withdrawTx });

            const account2BalanceAfter = await MockToken.read.balanceOf([account2.account.address]) ;
            const contractBalanceAfterWithdrawing = await MockToken.read.balanceOf([Erc20V2Contract.address]) ;

            expect(account2BalanceAfter - account2BalanceBefore).to.equal(bountyAmount);
            expect(contractBalanceAfterWithdrawing).to.equal(contractBalanceAfterBountyCreation - bountyAmount);
        });

        it('should revert when non-owner tries to withdraw', async function () {
            const { Erc20V2Contract: Erc20V2Contract, account1, account2, bountyAmount } = await loadFixture(createBountyFixture);

            await expect(
                Erc20V2Contract.write.withdraw([bountyAmount, account2.account.address], { account: account2.account })
            ).to.be.rejected;
        });

        it('should revert when trying to withdraw more than contract balance', async function () {
            const { Erc20V2Contract: Erc20V2Contract, deployer, account2 } = await loadFixture(createBountyFixture);
            const tooMuchAmount = parseEther('100');

            await expect(
                Erc20V2Contract.write.withdraw([tooMuchAmount, account2.account.address], { account: deployer.account })
            ).to.be.rejected;
        });
    });
});