import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const GAME_ADDRESS = '0x3d35dcbC10FA10b3Fa2360311fe42FFf60909468';

const abi = ["function s_subscriptionId() view returns (uint256)"];
const contract = new ethers.Contract(GAME_ADDRESS, abi, provider);

async function check() {
  const subId = await contract.s_subscriptionId();
  console.log("Subscription ID:", subId.toString());
}

check();