import { task } from "hardhat/config";

task("claim", "Claims all available rewards")
    .addParam("contract", "Stake contract address")
    .setAction(async (taskArgs, { ethers }) => {
        const Contract = await ethers.getContractFactory("StakeContract");
        const contract = await Contract.attach(taskArgs.contract);

        await contract.claim();
        console.log("Finished!");
    })