// test-game.js
import { ethers } from 'ethers';

const PRIVATE_KEY = 'f6e65e23a2f4730f71f326923b1f315d3c40b3e9820b8b158fdd445d32f47c6e'; // NEVER commit this!
const TOKEN_ADDRESS = '0x3255bCCdc69576c0bC9dD39d38fAeca4B81486bE';
const GAME_ADDRESS = '0x3d35dcbC10FA10b3Fa2360311fe42FFf60909468';

const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const tokenAbi = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address, uint256) returns (bool)',
  'function allowance(address, address) view returns (uint256)'
];

async function test() {
  const token = new ethers.Contract(TOKEN_ADDRESS, tokenAbi, wallet);
  
  console.log('Testing token contract...');
  const balance = await token.balanceOf(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'FLIP');
  
  console.log('\nApproving game contract...');
  const approveTx = await token.approve(GAME_ADDRESS, ethers.parseEther('10'));
  await approveTx.wait();
  console.log('✅ Approved');
  
  console.log('\nTesting game contract...');
  // Add your game contract test here based on its actual functions
}

test().catch(console.error);