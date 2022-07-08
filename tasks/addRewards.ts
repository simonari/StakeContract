import { task } from "hardhat/config";

task("addRewards", "Transfer rewards from owner's wallet to contract balance")
    .addParam("contract", "Stake contract address")
    .addParam("token", "Token address")
    .addParam("amount", "Amount of tokens to transfer")
    .setAction(async (taskArgs, { ethers }) => {
        const Contract = await ethers.getContractFactory("StakeContract");
        const Token = await ethers.getContractFactory("ERC20Token");

        const token = await Token.attach(taskArgs.token);

        await token.approve(taskArgs.contract, taskArgs.amount);
        const contract = await Contract.attach(taskArgs.contract);
        await contract.addRewardsToken(taskArgs.amount);

        console.log("Finished!");
    })