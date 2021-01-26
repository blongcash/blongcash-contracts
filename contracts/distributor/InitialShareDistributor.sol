pragma solidity ^0.6.0;

import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import '../interfaces/IDistributor.sol';
import '../interfaces/IRewardDistributionRecipient.sol';

contract InitialShareDistributor is IDistributor {
    using SafeMath for uint256;

    event Distributed(address pool, uint256 cashAmount);

    bool public once = true;

    IERC20 public share;
    IRewardDistributionRecipient public usdcashLPPool;
    uint256 public usdcashInitialBalance;
    IRewardDistributionRecipient public usdshareLPPool;
    uint256 public usdshareInitialBalance;

    constructor(
        IERC20 _share,
        IRewardDistributionRecipient _usdcashLPPool,
        uint256 _usdcashInitialBalance,
        IRewardDistributionRecipient _usdshareLPPool,
        uint256 _usdshareInitialBalance
    ) public {
        share = _share;
        usdcashLPPool = _usdcashLPPool;
        usdcashInitialBalance = _usdcashInitialBalance;
        usdshareLPPool = _usdshareLPPool;
        usdshareInitialBalance = _usdshareInitialBalance;
    }

    function distribute() public override {
        require(
            once,
            'InitialShareDistributor: you cannot run this function twice'
        );

        share.transfer(address(usdcashLPPool), usdcashInitialBalance);
        usdcashLPPool.notifyRewardAmount(usdcashInitialBalance);
        emit Distributed(address(usdcashLPPool), usdcashInitialBalance);

        share.transfer(address(usdshareLPPool), usdshareInitialBalance);
        usdshareLPPool.notifyRewardAmount(usdshareInitialBalance);
        emit Distributed(address(usdshareLPPool), usdshareInitialBalance);

        once = false;
    }
}
