pragma solidity ^0.4.16;

/**
 * Contract that handles initiatives and all the work around.
 * This contract holds a total balance which is distributed across the initiatives in determined
 * ways by this contract.
 */
contract Initiatives {

    struct Initiative {
        uint8 acceptance; // 1..100% (as 0..100) % of votes for this initiative to be accepted
        bytes20 contentHash; // SHA-1 hash of title and description of an initiative
        address initiator; // A guy who created this initiative
        address executor; // A person who completed the initiative and uploaded the evidence
        address[] backers; // Addresses which backed this initiative
        address[] voters; // Addresses which voted on this initiative. Kept for reset purpose only
        mapping (address => uint) funds; // Amounts funded by backers
        mapping (address => bool) voted; // Whether the backer already voted
        mapping (address => bool) vote; // Backer's vote
        uint numberOfVotes; // A number of votes received so far after executor appears
        uint totalFunds; // Total funds received by the initiative
        bool closed; // Determines whether initiative is closed
    }

    uint lastInitiativeId = 0;

    mapping (uint => Initiative) public initiative;

    event InitiativeCreated(uint id);
    event InitiativeCompleted(bool success);

    function getInitiativeById (uint id) public view returns(
        address initiator,
        uint8 acceptance,
        bytes20 contentHash,
        address executor,
        address[] backers,
        uint totalFunds,
        bool closed,
        address[] voters,
        bool[] votes
    ) {
        initiator = initiative[id].initiator;
        acceptance = initiative[id].acceptance;
        contentHash = initiative[id].contentHash;
        executor = initiative[id].executor;
        backers = initiative[id].backers;
        totalFunds = initiative[id].totalFunds;
        closed = initiative[id].closed;
        voters = new address[](initiative[id].numberOfVotes);
        votes = new bool[](initiative[id].numberOfVotes);
        for (uint i = 0; i < initiative[id].numberOfVotes; ++i) {
            voters[i] = initiative[id].voters[i];
            votes[i] = initiative[id].vote[voters[i]];
        }
    }

    function getBackerAmountByInitiativeId (uint id, address backer) public view returns(uint) {
        return initiative[id].funds[backer];
    }

    /**
     * @param contentHash Hash of the title/description.
     * @param acceptance Percentage of voters needed to accept the executor's work.
     * @return Created initiative ID.
     */
    function create (bytes20 contentHash, uint8 acceptance) public returns(uint) {
        require(acceptance > 0 && acceptance <= 100);
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
    function complete (uint id) public {
        require(initiative[id].initiator != address(0)); // initiative must exists
        require(initiative[id].totalFunds > 0); // cannot mark "empty" initiative as completed
        require(initiative[id].executor == address(0)); // cannot mark completed initiative again
        initiative[id].executor = msg.sender;
    }

    /**
     * Add funds to initiative.
     * @param id Initiative to back.
     */
    function back (uint id) public payable {
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

    /**
     * Vote on executor's job.
     * @param id Initiative to vote on.
     * @param isPositive Determine whether the vote is positive.
     */
    function vote (uint id, bool isPositive) public {
        Initiative storage ini = initiative[id];
        require(initiative[id].initiator != address(0)); // initiative must exists
        require(ini.closed == false); // cannot vote on closed initiatives
        require(ini.executor != address(0)); // must vote only when executor is set
        require(ini.voted[msg.sender] == false); // cannot vote twice
        require(ini.funds[msg.sender] > 0); // must backed at least something to vote
        if (ini.numberOfVotes < ini.voters.length) {
            ini.voters[ini.numberOfVotes] = msg.sender;
        } else {
            ini.voters.push(msg.sender);
        }
        ini.numberOfVotes += 1;
        ini.voted[msg.sender] = true;
        ini.vote[msg.sender] = isPositive;
        onAfterVote(ini);
    }

    /**
     * Check whether given initiative has enough votes to be closed or reverted.
     */
    function onAfterVote (Initiative storage ini) internal {
        uint positiveFunds = 0;
        uint negativeFunds = 0;
        for (uint i = 0; i < ini.numberOfVotes; ++i) {
            uint funds = ini.funds[ini.voters[i]];
            if (ini.vote[ini.voters[i]]) {
                positiveFunds += funds; // add to positive score
            } else {
                negativeFunds += funds;
            }
        }
        if (100 * positiveFunds / ini.totalFunds >= ini.acceptance) {
            completeInitiative(ini, true);
        } else if (100 * negativeFunds / ini.totalFunds > 100 - ini.acceptance) {
            completeInitiative(ini, false);
        } else if (ini.numberOfVotes == ini.backers.length) {
            completeInitiative(ini, false);
        }
    }

    /**
     * Complete initiative and fund the executor or rollback it to a voting state.
     */
    function completeInitiative (Initiative storage ini, bool success) internal {
        if (success) {
            ini.executor.transfer(ini.totalFunds);
            ini.closed = true;
        } else {
            for (uint i = 0; i < ini.numberOfVotes; ++i) {
                ini.voted[ini.voters[i]] = false;
            }
            ini.executor = address(0);
            ini.numberOfVotes = 0;
        }
        InitiativeCompleted(success);
    }

}