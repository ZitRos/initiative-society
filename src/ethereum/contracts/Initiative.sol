pragma solidity ^0.4.16;

contract Initiatives {

    struct Initiative {
        address initiator; // A guy who created this initiative
        uint8 acceptance; // 1..100% (as 0..100) % of votes for this initiative to be accepted
        bytes20 contentHash; // SHA-1 hash of title and description of an initiative
        address executor; // A person who completed the initiative and uploaded the evidence
        address[] backers; // Addresses which backed this initiative
        mapping (address => uint) funds; // Amounts funded by backers
        uint totalFunds; // Total funds received by the initiative
        bool closed; // Determines whether initiative is closed
    }

    uint lastInitiativeId = 0;

    mapping (uint => Initiative) public initiative;

    event InitiativeCreated(uint id);

    function Initiatives() public {

    }

    function createInitiative (bytes20 contentHash, uint8 acceptance) public returns(uint) {
        uint id = ++lastInitiativeId;
        initiative[id].initiator = msg.sender;
        initiative[id].acceptance = acceptance;
        initiative[id].contentHash = contentHash;
        InitiativeCreated(id);
        return id;
    }

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

}