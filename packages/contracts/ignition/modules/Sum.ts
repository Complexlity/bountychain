import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from 'viem'

export default buildModule("Sum", (m) => {
    const sum = m.contract("Sum", []);

    //Get the balance of the sum contract


    m.call(sum, "add", [BigInt(22)])
    console.log(m.call(sum, "getCurrentSum", []))
    console.log(m.call(sum, 'getBalance', []))
    
    return { sum };
})