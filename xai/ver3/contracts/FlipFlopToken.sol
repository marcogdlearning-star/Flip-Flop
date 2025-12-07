// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title FlipFlopToken
 * @dev Upgradeable ERC20 token for the FlipFlop gaming platform
 * Initially used as in-game currency, upgradeable to real meme coin at launch
 */
contract FlipFlopToken is
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    /// @notice Total supply cap (1 billion tokens)
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;

    /// @notice Mapping to track minted addresses for airdrop eligibility
    mapping(address => bool) public hasReceivedInitialTokens;

    /// @notice Emergency pause event
    event EmergencyPaused(address indexed pauser);
    /// @notice Emergency unpause event
    event EmergencyUnpaused(address indexed unpauser);
    /// @notice Initial token minting event
    event InitialTokensMinted(address indexed user, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract
     * @param initialOwner Address that will own the contract
     */
    function initialize(address initialOwner) public initializer {
        __ERC20_init("FlipFlop Token", "FLIP");
        __Ownable_init(initialOwner);
        __Pausable_init();
        __UUPSUpgradeable_init();
    }

    /**
     * @dev Mint initial tokens to a user (100 tokens for new players)
     * @param to Address to mint tokens to
     */
    function mintInitialTokens(address to) external onlyOwner {
        require(!hasReceivedInitialTokens[to], "User already received initial tokens");
        require(totalSupply() + 100 * 10**18 <= MAX_SUPPLY, "Would exceed max supply");

        hasReceivedInitialTokens[to] = true;
        _mint(to, 100 * 10**18);

        emit InitialTokensMinted(to, 100 * 10**18);
    }

    /**
     * @dev Mint tokens for purchases or rewards
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from an address
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /**
     * @dev Emergency pause all token transfers
     */
    function emergencyPause() external onlyOwner {
        _pause();
        emit EmergencyPaused(msg.sender);
    }

    /**
     * @dev Emergency unpause token transfers
     */
    function emergencyUnpause() external onlyOwner {
        _unpause();
        emit EmergencyUnpaused(msg.sender);
    }

    /**
     * @dev Hook that is called before any transfer of tokens
     * Replaces deprecated _beforeTokenTransfer
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        super._update(from, to, value);
    }

    /**
     * @dev Authorize contract upgrades (only owner)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Get token decimals (18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}