import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load deployment info
let deploymentInfo = null;
try {
  const deploymentPath = path.join(__dirname, '../../deployment.json');
  if (fs.existsSync(deploymentPath)) {
    deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  }
} catch (error) {
  console.warn('Could not load deployment info:', error.message);
}

// Contract ABIs (simplified - in production, load from artifacts)
const CONTRACT_ABIS = {
  RandomnessManager: [
    "function addGameToBatch(uint256 gameId) external returns (uint256)",
    "function isBatchReady(uint256 batchId) external view returns (bool)",
    "function getRandomForGame(uint256 batchId, uint256 gameIndex) external view returns (uint256)",
    "function gamesInCurrentBatch() external view returns (uint256)"
  ]
};

class ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.network = process.env.NETWORK || 'baseTestnet';

    this.initializeProvider();
  }

  /**
   * Initialize blockchain provider and signer
   */
  initializeProvider() {
    try {
      // For development, use a local provider
      if (this.network === 'localhost' || this.network === 'hardhat') {
        this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', this.provider);
      } else {
        // For production networks
        const rpcUrl = this.getRpcUrl();
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      }

      console.log(`Connected to ${this.network} network`);
    } catch (error) {
      console.error('Failed to initialize provider:', error);
    }
  }

  /**
   * Get RPC URL for the current network
   */
  getRpcUrl() {
    const urls = {
      base: 'https://mainnet.base.org',
      baseTestnet: 'https://sepolia.base.org',
      localhost: 'http://127.0.0.1:8545'
    };
    return urls[this.network] || urls.baseTestnet;
  }

  /**
   * Get contract address from deployment info
   * @param {string} contractName - Name of the contract
   * @returns {string} - Contract address
   */
  getContractAddress(contractName) {
    if (!deploymentInfo || !deploymentInfo.contracts) {
      throw new Error('Deployment info not found. Please deploy contracts first.');
    }
    const address = deploymentInfo.contracts[contractName];
    if (!address) {
      throw new Error(`Contract ${contractName} not found in deployment info`);
    }
    return address;
  }

  /**
   * Get contract instance
   * @param {string} contractName - Name of the contract
   * @returns {ethers.Contract} - Contract instance
   */
  getContractInstance(contractName) {
    if (this.contracts[contractName]) {
      return this.contracts[contractName];
    }

    const address = this.getContractAddress(contractName);
    const abi = CONTRACT_ABIS[contractName];

    if (!abi) {
      throw new Error(`ABI not found for contract ${contractName}`);
    }

    const contract = new ethers.Contract(address, abi, this.signer);
    this.contracts[contractName] = contract;

    return contract;
  }

  /**
   * Check if contracts are deployed and accessible
   * @returns {boolean} - True if all contracts are accessible
   */
  async checkContractsHealth() {
    try {
      const contractNames = Object.keys(CONTRACT_ABIS);
      for (const name of contractNames) {
        const contract = this.getContractInstance(name);
        // Try a simple view call to check if contract is accessible
        if (name === 'FlipFlopToken') {
          await contract.balanceOf(ethers.ZeroAddress);
        }
      }
      return true;
    } catch (error) {
      console.error('Contract health check failed:', error);
      return false;
    }
  }

  /**
   * Get current network info
   * @returns {Object} - Network information
   */
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getFeeData();

      return {
        chainId: network.chainId,
        name: network.name,
        blockNumber,
        gasPrice: {
          gasPrice: gasPrice.gasPrice?.toString(),
          maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString()
        }
      };
    } catch (error) {
      console.error('Failed to get network info:', error);
      return null;
    }
  }

  /**
   * Estimate gas for a contract call
   * @param {string} contractName - Name of the contract
   * @param {string} methodName - Method name
   * @param {Array} args - Method arguments
   * @returns {Object} - Gas estimation result
   */
  async estimateGas(contractName, methodName, args = []) {
    try {
      const contract = this.getContractInstance(contractName);
      const gasEstimate = await contract[methodName].estimateGas(...args);
      return {
        success: true,
        gasEstimate: gasEstimate.toString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update deployment info (for development/testing)
   * @param {Object} newDeploymentInfo - New deployment information
   */
  updateDeploymentInfo(newDeploymentInfo) {
    deploymentInfo = newDeploymentInfo;
    try {
      const deploymentPath = path.join(__dirname, '../../deployment.json');
      fs.writeFileSync(deploymentPath, JSON.stringify(newDeploymentInfo, null, 2));
      // Clear cached contracts so they reload with new addresses
      this.contracts = {};
      console.log('Deployment info updated');
    } catch (error) {
      console.error('Failed to update deployment info:', error);
    }
  }
}

// Export singleton instance
const contractServiceInstance = new ContractService();
export default contractServiceInstance;

// Export utility functions
export function getContractInstance(contractName) {
  return contractServiceInstance.getContractInstance(contractName);
}
