import { task } from "hardhat/config";

task("unstake", "Unstakes all alreadu staked tokens")
    .addParam("contract", "Stake contract address")
    .setAction(async (taskArgs, { ethers }) => {
        const Contract = await ethers.getContractFactory("StakeContract");
        const contract = await Contract.attach(taskArgs.contract);

        await contract.unstake();
        console.log("Finished!");
    })