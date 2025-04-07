import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";


describe("Sum", function () {
    
    async function deploySumContract() {
        const SumContract = await hre.viem.deployContract("Sum")
        const [owner, otherAccount] = await hre.viem.getWalletClients()
        return { SumContract, owner, otherAccount }
    }
    
    it("Should return the current sum", async function () {
            const { SumContract, owner, otherAccount } = await loadFixture(deploySumContract)
            const currentSum = await SumContract.read.getCurrentSum()
            expect(currentSum).to.equal(BigInt(0))
            
    })
    
    it("Should add to the contract", async function () {
        const { SumContract, owner, otherAccount } = await loadFixture(deploySumContract)
        await SumContract.write.add([BigInt(22)])
        expect(await SumContract.read.getCurrentSum()).to.equal(BigInt(22))
    })


})
