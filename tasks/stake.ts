import { task } from "hardhat/config";

task("stake", "Stake specified amount of LP tokens")
    .addParam("contract", "Stake contract address")
    .addParam("amount", "Amount of tokens that you want to stake")
    .setAction(async (taskArgs, { ethers }) => {
        const Contract = await ethers.getContractFactory("StakeContract");
        const contract = await Contract.attach(taskArgs.contract);

        await contract.stake(taskArgs.amount);
        console.log("Finished!");
    })