// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract StakeContract {
    IERC20 public immutable rewardsToken;
    IERC20 public immutable stakesToken;

    uint256 rewardsPercentMantissa = 2;
    int256 rewardsPercentExponent = 1;
    uint256 _rewardsSupply;

    uint256 _rewardsTime = 15 seconds; // in seconds
    uint256 _stakeTime = 15 seconds;   // in seconds
    uint256 _claimTime = 15 seconds;   // in seconds
    uint256 _freezeTime = 0 seconds;  // in seconds

    address private owner;
    mapping(address => Staker) stakers;
    

    struct Staker {
        uint256 amountStaked;
        uint256 timeOfLastStake;  // in seconds
        uint256 timeOfLastClaim;  // in seconds
        uint256 timeOfLastReward; // in seconds
        uint256 unclaimedRewards;
    }


    constructor(IERC20 _rewardsToken, IERC20 _stakesToken) {
        owner = msg.sender;
        rewardsToken = _rewardsToken;
        stakesToken = _stakesToken;
    }

    // modifiers

    modifier checkAllowance(IERC20 _token, uint256 _amount) {
        require(_token.allowance(msg.sender, address(this)) >= _amount, "Transaction doesn't allowed!");
        _;
    }

    modifier checkFreeze() {
        require(block.timestamp > _freezeTime, "Stake is freezed!");
        _;
    }

    // public

    function stake(uint256 _amount) public checkAllowance(stakesToken, _amount) checkFreeze() {
        require(_amount > 0, "Can't stake nothing!");
        require(stakers[msg.sender].timeOfLastStake + _stakeTime < block.timestamp, "Chill for a moment!");

        if (stakers[msg.sender].timeOfLastReward == 0) {
            stakers[msg.sender].timeOfLastReward = block.timestamp;
        }
        addRewards();

        stakesToken.transferFrom(msg.sender, address(this), _amount);

        stakers[msg.sender].amountStaked += _amount;
        stakers[msg.sender].timeOfLastStake = block.timestamp;
    }

    function unstake() public checkFreeze() {
        require(stakers[msg.sender].amountStaked > 0, "Can't unstake nothing!");
        require(stakers[msg.sender].timeOfLastStake + _stakeTime < block.timestamp, "Chill for a moment!");

        addRewards();

        stakesToken.transfer(msg.sender, stakers[msg.sender].amountStaked);

        stakers[msg.sender].amountStaked = 0;
        stakers[msg.sender].timeOfLastStake = block.timestamp;
    }

    function claim() public checkAllowance(rewardsToken, stakers[msg.sender].unclaimedRewards) {
        require(stakers[msg.sender].timeOfLastClaim + _claimTime < block.timestamp, "Chill for a moment!");
        addRewards();
        
        uint256 rewards = stakers[msg.sender].unclaimedRewards;

        _rewardsSupply -= rewards;

        rewardsToken.transfer(msg.sender, rewards);

        stakers[msg.sender].unclaimedRewards = 0;
        stakers[msg.sender].timeOfLastClaim = block.timestamp;
    }

    // calculus

    function calculateRewards() private view returns (uint256 _reward) {
        uint256 cycles = (block.timestamp - stakers[msg.sender].timeOfLastReward) / _rewardsTime;
        
        if (rewardsPercentExponent > 0) {
            return (stakers[msg.sender].amountStaked * rewardsPercentMantissa * cycles * 10 ** uint256(rewardsPercentExponent)) / 100;
        }
        else {
            return (stakers[msg.sender].amountStaked * rewardsPercentMantissa * cycles) / (10 ** uint256(-rewardsPercentExponent) * 100);
        }
    }
    
    function addRewards() private {
        if (block.timestamp - stakers[msg.sender].timeOfLastReward >= _rewardsTime) {
            uint256 rewards = calculateRewards();
            if (rewards > 0) {
                stakers[msg.sender].unclaimedRewards += rewards;
                stakers[msg.sender].timeOfLastReward = block.timestamp;
            }
        }
    }

    // views

    function rewardsSupply() public view returns(uint256 _balance) {
        return _rewardsSupply;
    }

    function rewardsPercent() public view returns(uint256 _percent, int256 _mantissa) {
        return (rewardsPercentMantissa, rewardsPercentExponent);
    }

    function rewardsTime() public view returns(uint256 _value) {
        return _rewardsTime;
    }

    function claimTime() public view returns(uint256 _value) {
        return _claimTime;
    }

    function stakeTime() public view returns(uint256 _value) {
        return _stakeTime;
    }

    function freezeTime() public view returns(uint256 _value) {
        return _freezeTime;
    }

    // owner's functions

    function addRewardsToken(uint256 _amount) public checkAllowance(rewardsToken, _amount) {
        require(msg.sender == owner, "You're not owner!");
        require(rewardsToken.balanceOf(owner) >= _amount , "Doesn't have enough reward tokens!");

        rewardsToken.transferFrom(owner, address(this), _amount);
        _rewardsSupply += _amount;
    }

    function returnRewardsToken() public {
        require(msg.sender == owner, "You're not owner!");

        rewardsToken.transfer(owner, _rewardsSupply);
        _rewardsSupply = 0;
    }

    function changeRewardsPercent(uint256 _mantissa, int256 _exponent) public {
        require(msg.sender == owner, "You're not owner!");
        rewardsPercentMantissa = _mantissa;
        rewardsPercentExponent = _exponent;
    }

    function freezeStake(uint256 _value) public {
        require(msg.sender == owner, "You're not owner!");

        _freezeTime = block.timestamp + _value;
    }
    
    function changeRewardsTime(uint256 _value) public {
        require(msg.sender == owner, "You're not owner!");
        _rewardsTime = _value;
    }

    function changeClaimTime(uint256 _value) public {
        require(msg.sender == owner, "You're not owner!");
        _claimTime = _value;
    }

    function changeStakeTime(uint256 _value) public {
        require(msg.sender == owner, "You're not owner!");
        _stakeTime = _value;
    }
}