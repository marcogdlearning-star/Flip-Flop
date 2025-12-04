// test-subscription.js
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const GAME_ADDRESS = '0x3d35dcbC10FA10b3Fa2360311fe42FFf60909468';

const abi = [
  "function s_subscriptionId() view returns (uint256)",
  "function owner() view returns (address)",
  "function setSubscriptionId(uint256) external"
];

const contract = new ethers.Contract(GAME_ADDRESS, abi, provider);

async function check() {
  const subId = await contract.s_subscriptionId();
  const owner = await contract.owner();
  console.log("Current Subscription ID:", subId.toString());
  console.log("Contract Owner:", owner);
  
  if (subId.toString() === "0") {
    console.log("NOT WORKING - Subscription ID is 0");
    console.log("Owner must call setSubscriptionId(newId)");
  } else {
    console.log("Should work! (if sub is funded + consumer added)");
  }
}

check();