import { expect } from 'chai';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { parseEther } from 'viem';

describe('Native_v1', function () {
    async function deployNativeV1Contract() {
        const [owner, otherAccount] = await hre.viem.getWalletClients()
        const UsdcContract = await hre.viem.deployContract('UsdcMock')
        //Send usdc to the owner
        await UsdcContract.write.mint([owner.account.address, parseEther('1000')])
        const NativeV1Contract = await hre.viem.deployContract('Native_v1', [owner.account.address, UsdcContract.address])
        //Check the owner's usdc balance
        const ownerBalance = await UsdcContract.read.balanceOf([owner.account.address])
        console.log("Owner's USDC balance", ownerBalance)
        return { NativeV1Contract, owner, otherAccount }
    }

    it("Should deploy", async function () {
        const Native_v1 = await loadFixture(deployNativeV1Contract)
        console.log("Native_v1", Native_v1.NativeV1Contract.address)
        expect(Native_v1.NativeV1Contract.address).to.not.be.null
    })
    
    describe("Create Bounty", function () {
        //Happy Paths
        it("should create an ETH bounty when correct amount is sent", function () {
            
            // Test that when TokenType.ETH is provided and the msg.value matches _amount,
            // the function creates a bounty correctly with the right parameters and emits the right event
          });
        

    })
})