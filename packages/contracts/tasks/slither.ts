import "@nomicfoundation/hardhat-toolbox-viem";
import { execSync } from "child_process";
import { task } from "hardhat/config";
import readline from "readline";

task("slither", "Prints the list of accounts", async (taskArgs, hre) => {
  
  // Check if slither exists on the machine
  let slitherExists = false;
  try {
    execSync("which slither");
    slitherExists = true;
    console.log("Slither found on machine, running security checks...");
  } catch (error) {
    console.log("Slither not found on machine, Skipping security checks...");
    return;
  }
  
  // Run slither on the contracts
  if (slitherExists) {
    try {
      execSync("slither .", { stdio: "inherit" });
    } catch (error: any) {
      console.log('\n')
      console.error("Slither found issues with the contracts");
      console.log("See ./slither.txt for more details");
      console.log('\n')
    
      // Create readline interface
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      // Wrap in a promise to make it async-compatible
      const continueProcess = await new Promise(resolve => {
        rl.question("Do you want to continue with the deployment? (y/n) ", (answer: string) => {
          rl.close();
          resolve(answer.toLowerCase() === 'y');
        });
      });
      
      if (!continueProcess) {
        console.log("Aborting deployment...");
        process.exit(1);
      }
      console.log("Continuing with deployment...");
    }
  }
});

