import { ethers } from "hardhat";

async function main() {
    const Contract = await ethers.getContractFactory("StakeContract");
    const contract = await Contract.deploy("0x91FC93074C87B21a2d33B2c7D89b52De4Ac6241a", "0x891856492afc1fa9d548b8f7F72140bFaFaD4B28");

    await contract.deployed();
    console.log("Contract address:", contract.address);
  }
  
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });