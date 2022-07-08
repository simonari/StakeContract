import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Stake contract", async () => {
    let contract;

    let stakeContract: Contract;
    let rewardsToken: Contract;
    let stakeToken: Contract;

    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addrs: SignerWithAddress[];

    let initRewardTokens = 10000;
    let initStakeTokens = 100;

    let stake = initStakeTokens / 2;

    beforeEach(async () => {
        contract = await ethers.getContractFactory("ERC20Token");
        rewardsToken = await contract.deploy("TokenA", "TKA");
        
        contract = await ethers.getContractFactory("ERC20Token");
        stakeToken = await contract.deploy("TokenB", "TKB");
        
        contract = await ethers.getContractFactory("StakeContract");
        stakeContract = await contract.deploy(stakeToken.address, rewardsToken.address);
            
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        await rewardsToken.mint(owner.address, initRewardTokens);
        await rewardsToken.mint(addr1.address, 2*initRewardTokens);
        await rewardsToken.approve(stakeContract.address, 2*initRewardTokens);
        await rewardsToken.connect(addr1).approve(stakeContract.address, 2*initRewardTokens);
        
        await stakeToken.mint(owner.address, initStakeTokens);
        await stakeToken.mint(addr1.address, 2*initStakeTokens);
        await stakeToken.approve(stakeContract.address, 2*initStakeTokens);
        await stakeToken.connect(addr1).approve(stakeContract.address, 2*2*initStakeTokens);
    })

    describe("Owner's commands", () => {
        it("Should add and return correct amount of reward tokens", async () => {
            await stakeContract.addRewardsToken(initRewardTokens);
            expect(await rewardsToken.balanceOf(owner.address)).to.equal(0);
            expect(await stakeContract.rewardsSupply()).to.equal(initRewardTokens);

            await stakeContract.returnRewardsToken();
            expect(await rewardsToken.balanceOf(owner.address)).to.equal(initRewardTokens);
            expect(await stakeContract.rewardsSupply()).to.equal(0);

            await expect(stakeContract.connect(addr1)
                                      .addRewardsToken(2*initRewardTokens))
                                      .to.be.revertedWith("You're not owner!");
            expect(await rewardsToken.balanceOf(addr1.address)).to.equal(2*initRewardTokens);
            expect(await stakeContract.rewardsSupply()).to.equal(0);
        })

    })
    describe("Views", () => {
        it ("Should change rewards percentage", async () => {
            let mantissa, exponent;
            [mantissa, exponent] = await stakeContract.rewardsPercent();
            let percent = mantissa * 10**exponent;
            expect(percent).to.equal(20);
        })
    })
    
    describe("Staking", () => {
        it("Should stake and return staked amount of tokens", async () => {
            await expect(stakeContract.stake(0)).to.be.revertedWith("Can't stake nothing!");
            await expect(stakeContract.unstake()).to.be.revertedWith("Can't unstake nothing!");

            let ownerBal = await stakeToken.balanceOf(owner.address);

            await stakeContract.stake(stake);
            ownerBal -= stake;

            expect(await stakeToken.balanceOf(owner.address)).to.equal(ownerBal);
            await expect(stakeContract.stake(stake)).to.be.revertedWith("Chill for a moment!");
            expect(await stakeToken.balanceOf(owner.address)).to.equal(ownerBal);

            await ethers.provider.send("evm_increaseTime", [15]);
            await ethers.provider.send("evm_mine", []);

            await stakeContract.unstake();
            ownerBal += stake;
            expect(await stakeToken.balanceOf(owner.address)).to.equal(ownerBal);

            await ethers.provider.send("evm_increaseTime", [15]);
            await ethers.provider.send("evm_mine", []);
            
            await stakeContract.stake(stake);
            ownerBal -= stake;

            await stakeContract.changeStakeTime(60);

            await ethers.provider.send("evm_increaseTime", [15]);
            await ethers.provider.send("evm_mine", []);
            
            await expect(stakeContract.stake(stake)).to.be.revertedWith("Chill for a moment!");
        })

        it("Should give and transfer rewards depending on claim and rewards interval", async () => {
            let mantissa, exponent;
            [mantissa, exponent] = await stakeContract.rewardsPercent();
            let percent = mantissa * 10**exponent;
            
            await stakeContract.addRewardsToken(initRewardTokens);
            let initClaimTime = Number(await stakeContract.claimTime());
            let claimTime = initClaimTime;
            await stakeContract.changeRewardsTime(claimTime); // for better usage

            expect(await stakeContract.rewardsTime()).to.equal(claimTime);

            let ownerBal = Number(await rewardsToken.balanceOf(owner.address));
            await stakeContract.stake(stake);
            
            await ethers.provider.send("evm_increaseTime", [claimTime]);
            await ethers.provider.send("evm_mine", []);

            await stakeContract.claim();
            ownerBal += stake * percent / 100;
            expect(await rewardsToken.balanceOf(owner.address)).to.equal(ownerBal);
            
            await ethers.provider.send("evm_increaseTime", [claimTime]);
            await ethers.provider.send("evm_mine", []);

            await stakeContract.claim();
            ownerBal += stake * percent / 100;
            expect(await rewardsToken.balanceOf(owner.address)).to.equal(ownerBal);
            
            await ethers.provider.send("evm_increaseTime", [4 * claimTime]);
            await ethers.provider.send("evm_mine", []);

            await stakeContract.claim();
            ownerBal += 4 * stake * percent / 100;
            expect(await rewardsToken.balanceOf(owner.address)).to.equal(ownerBal);

            await ethers.provider.send("evm_increaseTime", [claimTime]);
            await ethers.provider.send("evm_mine", []);
            
            await stakeContract.changeClaimTime(60);
            claimTime = 60;

            expect(await stakeContract.claimTime()).to.equal(claimTime);
            await expect(stakeContract.claim()).to.be.revertedWith("Chill for a moment!");

            await ethers.provider.send("evm_increaseTime", [claimTime - initClaimTime]);
            await ethers.provider.send("evm_mine", []);

            await stakeContract.claim();
            ownerBal += 4 * stake * percent / 100;
            expect(await rewardsToken.balanceOf(owner.address)).to.equal(ownerBal);
            
            await stakeContract.changeRewardsTime(claimTime);
            
            await ethers.provider.send("evm_increaseTime", [claimTime]);
            await ethers.provider.send("evm_mine", []);
            
            await stakeContract.claim();
            ownerBal += stake * percent / 100;
            expect(await rewardsToken.balanceOf(owner.address)).to.equal(ownerBal);

            await stakeContract.changeRewardsPercent(5, -2);
            [mantissa, exponent] = await stakeContract.rewardsPercent();
            percent = mantissa * 10**exponent;

            await ethers.provider.send("evm_increaseTime", [100 * claimTime]);
            await ethers.provider.send("evm_mine", []);

            await stakeContract.claim();
            ownerBal += Math.trunc(100 * stake * percent / 100);
            console.log(ownerBal);
            expect(await rewardsToken.balanceOf(owner.address)).to.equal(ownerBal);
        })
    })
})