// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title RandomnessManager
 * @dev Manages provable randomness using Chainlink VRF with batch processing
 * Provides gas-free randomness for games through pre-committed batches
 */
contract RandomnessManager is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    VRFConsumerBaseV2
{
    address public vrfCoordinator;

    /// @notice Chainlink VRF Configuration
    bytes32 public keyHash;
    uint64 public subscriptionId;
    uint32 public callbackGasLimit;
    uint16 public requestConfirmations;
    uint32 public numWords;

    /// @notice Randomness batch structure
    struct RandomnessBatch {
        uint256 requestId;
        uint256[] randomWords;
        uint256 timestamp;
        bool fulfilled;
        bytes32 commitment;
    }

    /// @notice Current batch being filled
    struct PendingBatch {
        uint256 requestId;
        uint256[] gameIds;
        bytes32 commitment;
        bool requested;
    }

    /// @notice Mapping of batch IDs to randomness batches
    mapping(uint256 => RandomnessBatch) public randomnessBatches;

    /// @notice Current pending batch
    PendingBatch public currentBatch;

    /// @notice Next batch ID
    uint256 public nextBatchId;

    /// @notice Batch size (number of games per batch)
    uint256 public batchSize;

    /// @notice Games in current batch
    uint256 public gamesInCurrentBatch;

    /// @notice Commitment reveal delay (to prevent manipulation)
    uint256 public constant COMMITMENT_DELAY = 1 minutes;

    /// @notice Events
    event RandomnessRequested(uint256 indexed batchId, uint256 requestId, bytes32 commitment);
    event RandomnessFulfilled(uint256 indexed batchId, uint256[] randomWords);
    event GameAddedToBatch(uint256 indexed batchId, uint256 gameId);
    event BatchProcessed(uint256 indexed batchId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address _vrfCoordinator) VRFConsumerBaseV2(_vrfCoordinator) {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract
     * @param initialOwner Address that will own the contract
     * @param _subscriptionId Chainlink VRF subscription ID
     * @param _keyHash Chainlink VRF key hash
     * @param _callbackGasLimit Gas limit for VRF callback
     * @param _requestConfirmations Number of confirmations required
     * @param _batchSize Number of games per batch
     */
    function initialize(
        address initialOwner,
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations,
        uint256 _batchSize
    ) public initializer {
        __Ownable_init(initialOwner);
        __Pausable_init();
        __UUPSUpgradeable_init();

        vrfCoordinator = _vrfCoordinator;
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;
        batchSize = _batchSize;
        numWords = uint32(_batchSize); // One random word per game

        nextBatchId = 1;
    }

    /**
     * @dev Add a game to the current batch
     * @param gameId Unique identifier for the game
     * @return batchId The batch ID this game was added to
     */
    function addGameToBatch(uint256 gameId) external onlyOwner returns (uint256) {
        require(!currentBatch.requested, "Current batch already requested");

        // If batch is full, process it first
        if (gamesInCurrentBatch >= batchSize) {
            _requestRandomnessForCurrentBatch();
        }

        // Add game to current batch
        currentBatch.gameIds.push(gameId);
        gamesInCurrentBatch++;

        emit GameAddedToBatch(nextBatchId, gameId);

        return nextBatchId;
    }

    /**
     * @dev Force process current batch (for end-of-period settlement)
     */
    function processCurrentBatch() external onlyOwner {
        require(gamesInCurrentBatch > 0, "No games in current batch");
        require(!currentBatch.requested, "Batch already requested");

        _requestRandomnessForCurrentBatch();
    }

    /**
     * @dev Internal function to request randomness for current batch
     */
    function _requestRandomnessForCurrentBatch() internal {
        require(gamesInCurrentBatch > 0, "No games to process");

        // Create commitment (hash of game IDs and timestamp)
        bytes32 commitment = keccak256(
            abi.encodePacked(currentBatch.gameIds, block.timestamp, nextBatchId)
        );

        currentBatch.commitment = commitment;
        currentBatch.requested = true;

        // Request randomness from Chainlink VRF using low-level call
        (bool success, bytes memory data) = vrfCoordinator.call(
            abi.encodeWithSignature(
                "requestRandomWords(bytes32,uint64,uint16,uint32,uint32)",
                keyHash,
                subscriptionId,
                requestConfirmations,
                callbackGasLimit,
                numWords
            )
        );
        require(success, "VRF request failed");
        uint256 requestId = abi.decode(data, (uint256));

        currentBatch.requestId = requestId;

        // Store batch info
        randomnessBatches[nextBatchId] = RandomnessBatch({
            requestId: requestId,
            randomWords: new uint256[](0), // Will be filled in fulfillRandomWords
            timestamp: block.timestamp,
            fulfilled: false,
            commitment: commitment
        });

        emit RandomnessRequested(nextBatchId, requestId, commitment);

        // Reset for next batch
        nextBatchId++;
        gamesInCurrentBatch = 0;
        delete currentBatch.gameIds;
        currentBatch.requested = false;
    }

    /**
     * @dev Chainlink VRF callback function
     * @param _requestId The request ID
     * @param _randomWords Array of random words
     */
    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        // Find the batch that matches this request ID
        uint256 batchId = 0;
        for (uint256 i = nextBatchId - 1; i > 0; i--) {
            if (randomnessBatches[i].requestId == _requestId) {
                batchId = i;
                break;
            }
        }

        require(batchId > 0, "Batch not found for request ID");
        require(!randomnessBatches[batchId].fulfilled, "Batch already fulfilled");
        require(_randomWords.length == batchSize, "Incorrect number of random words");

        // Verify commitment (optional but good practice)
        bytes32 computedCommitment = keccak256(
            abi.encodePacked(currentBatch.gameIds, randomnessBatches[batchId].timestamp, batchId)
        );
        require(computedCommitment == randomnessBatches[batchId].commitment, "Commitment mismatch");

        // Store the random words
        randomnessBatches[batchId].randomWords = _randomWords;
        randomnessBatches[batchId].fulfilled = true;

        emit RandomnessFulfilled(batchId, _randomWords);
        emit BatchProcessed(batchId);
    }

    /**
     * @dev Get random number for a specific game in a batch
     * @param batchId The batch ID
     * @param gameIndex Index of the game within the batch
     * @return randomNumber The random number for this game
     */
    function getRandomForGame(uint256 batchId, uint256 gameIndex) external view returns (uint256) {
        require(randomnessBatches[batchId].fulfilled, "Batch not yet fulfilled");
        require(gameIndex < randomnessBatches[batchId].randomWords.length, "Game index out of bounds");

        return randomnessBatches[batchId].randomWords[gameIndex];
    }

    /**
     * @dev Get multiple random numbers for games in a batch
     * @param batchId The batch ID
     * @param startIndex Starting index
     * @param count Number of random numbers to return
     */
    function getRandomBatch(uint256 batchId, uint256 startIndex, uint256 count)
        external
        view
        returns (uint256[] memory)
    {
        require(randomnessBatches[batchId].fulfilled, "Batch not yet fulfilled");

        uint256[] memory batch = randomnessBatches[batchId].randomWords;
        require(startIndex + count <= batch.length, "Range out of bounds");

        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = batch[startIndex + i];
        }

        return result;
    }

    /**
     * @dev Check if a batch is ready (fulfilled)
     * @param batchId The batch ID
     */
    function isBatchReady(uint256 batchId) external view returns (bool) {
        return randomnessBatches[batchId].fulfilled;
    }

    /**
     * @dev Get batch information
     * @param batchId The batch ID
     */
    function getBatchInfo(uint256 batchId) external view returns (RandomnessBatch memory) {
        return randomnessBatches[batchId];
    }

    /**
     * @dev Update VRF parameters (admin only)
     */
    function updateVRFConfig(
        bytes32 _keyHash,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations
    ) external onlyOwner {
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;
    }

    /**
     * @dev Update batch size (admin only)
     */
    function updateBatchSize(uint256 _batchSize) external onlyOwner {
        require(_batchSize > 0, "Batch size must be > 0");
        batchSize = _batchSize;
        numWords = uint32(_batchSize);
    }

    /**
     * @dev Emergency pause
     */
    function emergencyPause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Emergency unpause
     */
    function emergencyUnpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Authorize contract upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
