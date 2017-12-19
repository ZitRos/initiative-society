pragma solidity ^0.4.16;

/**
 * Contract that handles initiatives and all the work around.
 * This contract holds a total balance which is distributed across the initiatives in determined
 * ways by this contract.
 */
contract Initiatives {

    struct Initiative {
        address initiator; // A guy who created this initiative
        uint8 acceptance; // 1..100% (as 0..100) % of votes for this initiative to be accepted
        bytes20 contentHash; // SHA-1 hash of title and description of an initiative
        address executor; // A person who completed the initiative and uploaded the evidence
        address[] backers; // Addresses which backed this initiative
        mapping (address => uint) funds; // Amounts funded by backers
        mapping (address => bool) votes; // After initiative completion backers vote
        uint totalPositiveVotes; // Total positive votes received from backers
        uint totalNegativeVotes; // Total negative votes received from backers
        uint totalFunds; // Total funds received by the initiative
        bool closed; // Determines whether initiative is closed
    }

    uint lastInitiativeId = 0;

    mapping (uint => Initiative) public initiative;

    event InitiativeCreated(uint id);

    function getInitiativeById (uint id) public view returns(
        address, uint8, bytes20, address, address[], uint, bool
    ) {
        return (
        initiative[id].initiator, initiative[id].acceptance, initiative[id].contentHash,
        initiative[id].executor, initiative[id].backers, initiative[id].totalFunds,
        initiative[id].closed
        );
    }

    function getBackerAmountByInitiativeId (uint id, address backer) public view returns(uint) {
        return initiative[id].funds[backer];
    }

    /**
     * @param contentHash Hash of the title/description.
     * @param acceptance Percentage of voters needed to accept the executor's work.
     * @return Created initiative ID.
     */
    function createInitiative (bytes20 contentHash, uint8 acceptance) public returns(uint) {
        uint id = ++lastInitiativeId;
        initiative[id].initiator = msg.sender;
        initiative[id].acceptance = acceptance;
        initiative[id].contentHash = contentHash;
        InitiativeCreated(id);
        return id;
    }

    /**
     * Mark the initiative completed by the sender.
     * @param id Initiative to complete.
     */
    function completeInitiative (uint id) public {
        require(initiative[id].initiator != address(0)); // initiative must exists
        require(initiative[id].totalFunds > 0); // cannot mark "empty" initiative as completed
        require(initiative[id].executor == address(0)); // cannot mark completed initiative again
        initiative[id].executor = msg.sender;
    }

    /**
     * Add funds to initiative.
     * @param id Initiative to back.
     */
    function backInitiative (uint id) public payable {
        require(msg.value > 0); // backer should really transfer some value
        require(initiative[id].initiator != address(0)); // initiative must exists
        require(initiative[id].executor == address(0)); // cannot back executed initiative
        require(initiative[id].closed == false); // cannot back closed initiative
        if (initiative[id].funds[msg.sender] == 0) { // if backed for the first time
            initiative[id].backers.push(msg.sender); // add to the list of backers
        }
        initiative[id].funds[msg.sender] += msg.value;
        initiative[id].totalFunds += msg.value;
    }

}