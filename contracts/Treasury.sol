pragma solidity ^0.6.0;

import '@openzeppelin/contracts/math/Math.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import './interfaces/IOracle.sol';
import './interfaces/IBoardroom.sol';
import './interfaces/IAsset.sol';
import './interfaces/ISimpleERCFund.sol';
import './lib/Babylonian.sol';
import './lib/FixedPoint.sol';
import './lib/Safe112.sol';
import './owner/Operator.sol';
import './utils/Epoch.sol';
import './utils/ContractGuard.sol';

/**
 * @title  Treasury contract
 * @notice Monetary policy logic to adjust supplies of blong cash assets
 * @author Summer Smith & Rick Sanchez
 */
contract Treasury is ContractGuard, Epoch {
    using FixedPoint for *;
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;
    using Safe112 for uint112;

    /* ========== STATE VARIABLES ========== */

    // ========== FLAGS
    bool public migrated = false;
    bool public initialized = false;

    // ========== CORE
    address public fund;
    address public cash;
    address public bond;
    address public share;
    address public boardroom;
    address public lpBoardroom;

    address public bondOracle;
    address public seigniorageOracle;

    // ========== PARAMS
    uint256 public cashPriceOne;
    uint256 public cashPriceCeiling;
    uint256 public bondDepletionFloor;
    uint256 private accumulatedSeigniorage = 0;
    uint256 public lastTotalSupply = 0;
    uint256 public fundAllocationRate = 2; // %
    uint256 public maxInflationRate = 10;
    uint256 public maxBondForsale = 10;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _cash,
        address _bond,
        address _share,
        address _bondOracle,
        address _seigniorageOracle,
        address _boardroom,
        address _lpBoardroom,
        address _fund,
        uint256 _startTime
    ) public Epoch(8 hours, _startTime, 0) {
        cash = _cash;
        bond = _bond;
        share = _share;
        bondOracle = _bondOracle;
        seigniorageOracle = _seigniorageOracle;

        boardroom = _boardroom;
        lpBoardroom = _lpBoardroom;
        fund = _fund;

        cashPriceOne = 10**18;
        cashPriceCeiling = uint256(102).mul(cashPriceOne).div(10**2);

        bondDepletionFloor = uint256(1000).mul(cashPriceOne);
    }

    /* =================== Modifier =================== */

    modifier checkMigration {
        require(!migrated, 'Treasury: migrated');

        _;
    }

    modifier checkOperator {
        require(
            IAsset(cash).operator() == address(this) &&
                IAsset(bond).operator() == address(this) &&
                IAsset(share).operator() == address(this) &&
                Operator(boardroom).operator() == address(this) &&
                Operator(lpBoardroom).operator() == address(this),
            'Treasury: need more permission'
        );

        _;
    }

    /* ========== VIEW FUNCTIONS ========== */

    // budget
    function getReserve() public view returns (uint256) {
        return accumulatedSeigniorage;
    }

    // oracle
    function getBondOraclePrice() public view returns (uint256) {
        return _getCashPrice(bondOracle);
    }

    function getSeigniorageOraclePrice() public view returns (uint256) {
        return _getCashPrice(seigniorageOracle);
    }

    function _getCashPrice(address oracle) internal view returns (uint256) {
        try IOracle(oracle).consult(cash, 1e18) returns (uint256 price) {
            return price;
        } catch {
            revert('Treasury: failed to consult cash price from the oracle');
        }
    }

    /* ========== GOVERNANCE ========== */

    function initialize() public checkOperator {
        require(!initialized, 'Treasury: initialized');

        // burn all of it's balance
        IAsset(cash).burn(IERC20(cash).balanceOf(address(this)));

        // set accumulatedSeigniorage to it's balance
        accumulatedSeigniorage = IERC20(cash).balanceOf(address(this));

        initialized = true;
        emit Initialized(msg.sender, block.number);
    }

    function migrate(address target) public onlyOperator checkOperator {
        require(!migrated, 'Treasury: migrated');

        // cash
        Operator(cash).transferOperator(target);
        Operator(cash).transferOwnership(target);
        IERC20(cash).transfer(target, IERC20(cash).balanceOf(address(this)));

        // bond
        Operator(bond).transferOperator(target);
        Operator(bond).transferOwnership(target);
        IERC20(bond).transfer(target, IERC20(bond).balanceOf(address(this)));

        // share
        Operator(share).transferOperator(target);
        Operator(share).transferOwnership(target);
        IERC20(share).transfer(target, IERC20(share).balanceOf(address(this)));

        migrated = true;
        emit Migration(target);
    }

    function setFund(address newFund) public onlyOperator {
        fund = newFund;
        emit ContributionPoolChanged(msg.sender, newFund);
    }

    function setFundAllocationRate(uint256 rate) public onlyOperator {
        fundAllocationRate = rate;
        emit ContributionPoolRateChanged(msg.sender, rate);
    }

    /* ========== MUTABLE FUNCTIONS ========== */

    function _updateCashPrice() internal {
        try IOracle(bondOracle).update()  {} catch {}
        try IOracle(seigniorageOracle).update()  {} catch {}
    }

    function buyBonds(uint256 amount, uint256 targetPrice)
        external
        onlyOneBlock
        checkMigration
        checkStartTime
        checkOperator
    {
        require(amount > 0, 'Treasury: cannot purchase bonds with zero amount');

        uint256 cashPrice = _getCashPrice(bondOracle);
        require(cashPrice == targetPrice, 'Treasury: cash price moved');
        require(
            cashPrice < cashPriceOne, // price < $1
            'Treasury: cashPrice not eligible for bond purchase'
        );

        uint256 bondPrice = cashPrice;
        uint256 bondSupply = IERC20(bond).totalSupply();
        require(bondSupply < lastTotalSupply.mul(maxBondForsale).div(100), 'Treasury: bond has been sold out');

        IAsset(cash).burnFrom(msg.sender, amount);
        IAsset(bond).mint(msg.sender, amount.mul(1e18).div(bondPrice));
        _updateCashPrice();

        emit BoughtBonds(msg.sender, amount);
    }

    function redeemBonds(uint256 amount, uint256 targetPrice)
        external
        onlyOneBlock
        checkMigration
        checkStartTime
        checkOperator
    {
        require(amount > 0, 'Treasury: cannot redeem bonds with zero amount');

        uint256 cashPrice = _getCashPrice(bondOracle);
        require(cashPrice == targetPrice, 'Treasury: cash price moved');
        require(
            cashPrice > cashPriceCeiling, // price > $1.02
            'Treasury: cashPrice not eligible for bond purchase'
        );
        require(
            IERC20(cash).balanceOf(address(this)) >= amount,
            'Treasury: treasury has no more budget'
        );

        accumulatedSeigniorage = accumulatedSeigniorage.sub(
            Math.min(accumulatedSeigniorage, amount)
        );

        IAsset(bond).burnFrom(msg.sender, amount);
        IERC20(cash).safeTransfer(msg.sender, amount);
        _updateCashPrice();

        emit RedeemedBonds(msg.sender, amount);
    }

    function allocateSeigniorage()
        external
        onlyOneBlock
        checkMigration
        checkStartTime
        checkEpoch
        checkOperator
    {
        _updateCashPrice();
        uint256 cashPrice = _getCashPrice(seigniorageOracle);
        if (cashPrice <= cashPriceCeiling) {
            return; // just advance epoch instead revert
        }

        // circulating supply
        uint256 cashSupply = IERC20(cash).totalSupply().sub(
            accumulatedSeigniorage
        );
        uint256 percentage = cashPrice.sub(cashPriceOne);
        uint256 seigniorage = cashSupply.mul(percentage).div(1e18);
        uint256 maxSeigniorage = cashSupply.mul(maxInflationRate).div(100);
        if (seigniorage > maxSeigniorage) {
            seigniorage = maxSeigniorage;
        }
        IAsset(cash).mint(address(this), seigniorage);

        // ======================== BIP-3
        uint256 fundReserve = seigniorage.mul(fundAllocationRate).div(100);
        if (fundReserve > 0) {
            IERC20(cash).safeApprove(fund, fundReserve);
            ISimpleERCFund(fund).deposit(
                cash,
                fundReserve,
                'Treasury: Seigniorage Allocation'
            );
            emit ContributionPoolFunded(now, fundReserve);
        }

        seigniorage = seigniorage.sub(fundReserve);

        // ======================== BIP-4
        uint256 treasuryReserve = Math.min(
            seigniorage,
            IERC20(bond).totalSupply().sub(accumulatedSeigniorage)
        );
        if (treasuryReserve > 0) {
            accumulatedSeigniorage = accumulatedSeigniorage.add(
                treasuryReserve
            );
            emit TreasuryFunded(now, treasuryReserve);
        }

        // boardroom
        uint256 boardroomReserve = seigniorage.sub(treasuryReserve);
        if (boardroomReserve > 0) {
            uint256 shareBoardroomReserve = boardroomReserve.mul(4).div(10);
            uint256 lpBoardroomReserve = boardroomReserve.sub(shareBoardroomReserve);
            IERC20(cash).safeApprove(boardroom, shareBoardroomReserve);
            IBoardroom(boardroom).allocateSeigniorage(shareBoardroomReserve);
            IERC20(cash).safeApprove(lpBoardroom, lpBoardroomReserve);
            IBoardroom(lpBoardroom).allocateSeigniorage(lpBoardroomReserve);
            emit BoardroomFunded(now, boardroomReserve);
        }

        lastTotalSupply = IERC20(cash).totalSupply();
    }

    function setMaxInflationRate(uint256 rate) public onlyOperator {
        maxInflationRate = rate;
        emit MaxInflationRateChanged(msg.sender, rate);
    }

    function setMaxBondForsale(uint256 maxBond) public onlyOperator {
        maxBondForsale = maxBond;
        emit MaxBondForsaleChanged(msg.sender, maxBond);
    }

    // GOV
    event Initialized(address indexed executor, uint256 at);
    event Migration(address indexed target);
    event ContributionPoolChanged(address indexed operator, address newFund);
    event ContributionPoolRateChanged(
        address indexed operator,
        uint256 newRate
    );
    event MaxInflationRateChanged(
        address indexed operator,
        uint256 newRate
    );
    event MaxBondForsaleChanged(
        address indexed operator,
        uint256 maxBond
    );

    // CORE
    event RedeemedBonds(address indexed from, uint256 amount);
    event BoughtBonds(address indexed from, uint256 amount);
    event TreasuryFunded(uint256 timestamp, uint256 seigniorage);
    event BoardroomFunded(uint256 timestamp, uint256 seigniorage);
    event ContributionPoolFunded(uint256 timestamp, uint256 seigniorage);
}
