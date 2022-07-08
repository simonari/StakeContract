import { ethers } from "hardhat";

async function main() {
    const Token = await ethers.getContractFactory("ERC20Token");
    const token = await Token.deploy("LPToken", "TEST");
  
    let [owner, ...addrs] = await ethers.getSigners();

    await token.deployed();
    await token.mint(owner.address, 10 * 10 ** 8);
    console.log("Token address:", token.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });