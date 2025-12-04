// check-contracts.js
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');

async function checkContract(address, name) {
  console.log(`\n${name}: ${address}`);
  const code = await provider.getCode(address);
  
  if (code === '0x') {
    console.log('❌ No contract found at this address');
    return;
  }
  
  console.log('✅ Contract exists');
  
  // Try to get contract info if verified
  try {
    const response = await fetch(
      `https://api-sepolia.basescan.org/api?module=contract&action=getabi&address=${address}`
    );
    const data = await response.json();
    
    if (data.status === '1') {
      const abi = JSON.parse(data.result);
      console.log('\nFunctions:');
      abi.filter(item => item.type === 'function').forEach(func => {
        console.log(`  - ${func.name}(${func.inputs.map(i => i.type).join(', ')})`);
      });
      
      console.log('\nEvents:');
      abi.filter(item => item.type === 'event').forEach(event => {
        console.log(`  - ${event.name}`);
      });
    } else {
      console.log('Contract not verified on explorer');
    }
  } catch (error) {
    console.log('Could not fetch ABI from explorer');
  }
}

checkContract('0x3255bCCdc69576c0bC9dD39d38fAeca4B81486bE', 'Token Contract');
checkContract('0x3d35dcbC10FA10b3Fa2360311fe42FFf60909468', 'Game Contract');