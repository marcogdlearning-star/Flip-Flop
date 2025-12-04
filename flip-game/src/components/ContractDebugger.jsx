// Add this to your App.jsx temporarily to debug contracts
// Place it after connecting wallet but before game selection

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const ContractDebugger = ({ account }) => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const TOKEN_ADDRESS = '0x3255bCCdc69576c0bC9dD39d38fAeca4B81486bE';
  const GAME_ADDRESS = '0x3d35dcbC10FA10b3Fa2360311fe42FFf60909468';

  useEffect(() => {
    checkContracts();
  }, []);

  const checkContracts = async () => {
    setLoading(true);
    const info = {
      token: await checkContract(TOKEN_ADDRESS, 'Token'),
      game: await checkContract(GAME_ADDRESS, 'Game'),
      network: await checkNetwork()
    };
    setDebugInfo(info);
    setLoading(false);
  };

  const checkContract = async (address, name) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const code = await provider.getCode(address);
      
      const result = {
        name,
        address,
        exists: code !== '0x',
        functions: [],
        events: []
      };

      if (result.exists) {
        // Try to fetch ABI from BaseScan
        try {
          const response = await fetch(
            `https://api-sepolia.basescan.org/api?module=contract&action=getabi&address=${address}`
          );
          const data = await response.json();
          
          if (data.status === '1') {
            const abi = JSON.parse(data.result);
            result.verified = true;
            result.functions = abi
              .filter(item => item.type === 'function')
              .map(func => ({
                name: func.name,
                inputs: func.inputs.map(i => `${i.type} ${i.name || ''}`).join(', '),
                outputs: func.outputs?.map(o => o.type).join(', ') || 'void',
                stateMutability: func.stateMutability
              }));
            result.events = abi
              .filter(item => item.type === 'event')
              .map(event => event.name);
          } else {
            result.verified = false;
          }
        } catch (error) {
          result.verified = false;
          result.error = 'Could not fetch ABI';
        }

        // Try to read basic info
        try {
          if (name === 'Token') {
            const tokenContract = new ethers.Contract(
              address,
              [
                'function name() view returns (string)',
                'function symbol() view returns (string)',
                'function decimals() view returns (uint8)',
                'function balanceOf(address) view returns (uint256)'
              ],
              provider
            );
            
            result.name = await tokenContract.name().catch(() => 'Unknown');
            result.symbol = await tokenContract.symbol().catch(() => 'FLIP');
            result.decimals = await tokenContract.decimals().catch(() => 18);
            result.balance = ethers.formatEther(
              await tokenContract.balanceOf(account).catch(() => 0)
            );
          }
        } catch (error) {
          result.readError = error.message;
        }
      }

      return result;
    } catch (error) {
      return {
        name,
        address,
        error: error.message
      };
    }
  };

  const checkNetwork = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      return {
        name: network.name,
        chainId: Number(network.chainId),
        isBaseSepolia: Number(network.chainId) === 84532
      };
    } catch (error) {
      return { error: error.message };
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 mb-4 max-w-2xl mx-auto">
        <div className="text-white">Checking contracts...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 mb-4 max-w-2xl mx-auto text-left">
      <h2 className="text-xl font-bold text-white mb-4">🔍 Contract Debugger</h2>
      
      {/* Network Info */}
      <div className="mb-4 p-4 bg-gray-700 rounded-lg">
        <h3 className="text-white font-semibold mb-2">Network</h3>
        <div className="text-sm space-y-1">
          <div className="text-gray-300">
            Chain ID: <span className="text-white">{debugInfo.network.chainId}</span>
            {debugInfo.network.isBaseSepolia ? 
              <span className="ml-2 text-green-400">✓ Base Sepolia</span> : 
              <span className="ml-2 text-red-400">✗ Wrong Network!</span>
            }
          </div>
        </div>
      </div>

      {/* Token Contract */}
      <div className="mb-4 p-4 bg-gray-700 rounded-lg">
        <h3 className="text-white font-semibold mb-2">
          Token Contract {debugInfo.token.exists ? '✓' : '✗'}
        </h3>
        <div className="text-xs text-gray-400 mb-2 break-all">
          {debugInfo.token.address}
        </div>
        
        {debugInfo.token.exists && (
          <>
            <div className="text-sm space-y-1 mb-3">
              {debugInfo.token.symbol && (
                <div className="text-gray-300">
                  Symbol: <span className="text-white">{debugInfo.token.symbol}</span>
                </div>
              )}
              {debugInfo.token.balance && (
                <div className="text-gray-300">
                  Your Balance: <span className="text-white">{debugInfo.token.balance}</span>
                </div>
              )}
              <div className="text-gray-300">
                Verified: {debugInfo.token.verified ? 
                  <span className="text-green-400">Yes</span> : 
                  <span className="text-yellow-400">No</span>
                }
              </div>
            </div>

            {debugInfo.token.functions.length > 0 && (
              <details className="mt-2">
                <summary className="text-sm text-purple-400 cursor-pointer">
                  Show Functions ({debugInfo.token.functions.length})
                </summary>
                <div className="mt-2 space-y-1 text-xs text-gray-300 pl-4">
                  {debugInfo.token.functions.slice(0, 10).map((func, i) => (
                    <div key={i} className="font-mono">
                      {func.name}({func.inputs}) → {func.outputs}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
        
        {debugInfo.token.error && (
          <div className="text-red-400 text-sm">{debugInfo.token.error}</div>
        )}
      </div>

      {/* Game Contract */}
      <div className="mb-4 p-4 bg-gray-700 rounded-lg">
        <h3 className="text-white font-semibold mb-2">
          Game Contract {debugInfo.game.exists ? '✓' : '✗'}
        </h3>
        <div className="text-xs text-gray-400 mb-2 break-all">
          {debugInfo.game.address}
        </div>
        
        {debugInfo.game.exists && (
          <>
            <div className="text-sm space-y-1 mb-3">
              <div className="text-gray-300">
                Verified: {debugInfo.game.verified ? 
                  <span className="text-green-400">Yes</span> : 
                  <span className="text-yellow-400">No - Need to verify contract</span>
                }
              </div>
            </div>

            {debugInfo.game.functions.length > 0 ? (
              <details className="mt-2">
                <summary className="text-sm text-purple-400 cursor-pointer">
                  Show Functions ({debugInfo.game.functions.length})
                </summary>
                <div className="mt-2 space-y-1 text-xs text-gray-300 pl-4">
                  {debugInfo.game.functions.map((func, i) => (
                    <div key={i} className="font-mono">
                      <span className="text-purple-300">{func.name}</span>
                      ({func.inputs}) → {func.outputs}
                    </div>
                  ))}
                </div>
              </details>
            ) : (
              <div className="text-yellow-400 text-sm mt-2">
                ⚠️ No functions found. Contract needs to be verified on BaseScan.
              </div>
            )}

            {debugInfo.game.events.length > 0 && (
              <details className="mt-2">
                <summary className="text-sm text-purple-400 cursor-pointer">
                  Show Events ({debugInfo.game.events.length})
                </summary>
                <div className="mt-2 space-y-1 text-xs text-gray-300 pl-4">
                  {debugInfo.game.events.map((event, i) => (
                    <div key={i} className="font-mono">{event}</div>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
        
        {debugInfo.game.error && (
          <div className="text-red-400 text-sm">{debugInfo.game.error}</div>
        )}
      </div>

      {/* Action Items */}
      <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
        <h3 className="text-blue-200 font-semibold mb-2">📝 Next Steps:</h3>
        <ol className="text-sm text-blue-300 space-y-2 list-decimal list-inside">
          {!debugInfo.network.isBaseSepolia && (
            <li className="text-red-300">Switch to Base Sepolia network!</li>
          )}
          {!debugInfo.token.exists && (
            <li className="text-red-300">Token contract not found - check address</li>
          )}
          {!debugInfo.game.exists && (
            <li className="text-red-300">Game contract not found - check address</li>
          )}
          {debugInfo.game.exists && !debugInfo.game.verified && (
            <li className="text-yellow-300">
              Verify your game contract on BaseScan to see functions
            </li>
          )}
          {debugInfo.game.exists && debugInfo.game.verified && debugInfo.game.functions.length > 0 && (
            <li className="text-green-300">
              ✓ Contracts are ready! Check the function names above and update useContract.js if needed
            </li>
          )}
        </ol>
      </div>

      <button
        onClick={checkContracts}
        className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm transition-colors"
      >
        🔄 Refresh
      </button>
    </div>
  );
};

export default ContractDebugger;