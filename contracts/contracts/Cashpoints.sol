// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
//pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract CashPoints is ERC20 {
    struct CashPoint {
        string _name; //short Name
        string city;
        int256 latitude; // latitude coordinate
        int256 longitude; // longitude coordinate
        uint accuracy; // accuracy of the location in meters
        string _phoneNumber;
        string _currency;
        uint _buy; //local currency to usd buy rate
        uint _sell; //local currency to usd sell rate
        string _endTime; //when time as cashpoint will expire
        bool _isCashPoint;
    }

    IERC20 public DollarToken;
    mapping(address => CashPoint) public cashpoints;
    mapping(uint => address) public keys;
    event CreatedCashPoint(address cashpoint);
    event UpdatedCashPoint(address cashpoint);
    event Received(address, uint);
    //add the keyword payable to the state variable
    address payable public Owner;
    uint public constant MAX_SUPPLY = 100000;
    uint public AVAILABLE_TOKENS;
    uint public PRICE_PER_TOKEN; //erc20 token price
    uint public CASHPOINT_FEE = 0.5 ether;
    uint public BASE_FEE = 1 ether;
    uint public TRANSACTION_COMMISION = 1; //percentage commission on transactions routed through the contract
    uint public count = 0;
    bool public reentrancyLock = false; // Added reentrancyLock

    constructor(address _tokenAddress) ERC20("Chikwama", "CHK") {
        DollarToken = IERC20(_tokenAddress);
        Owner = payable(msg.sender);
        _mint(Owner, 10000);
        AVAILABLE_TOKENS = 90000;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    // Define the nonReentrant modifier
    modifier nonReentrant() {
        require(!reentrancyLock, "Reentrancy is not allowed");
        reentrancyLock = true;
        _;
        reentrancyLock = false;
    }

    function setPrice() public {
        uint256 contractBalance = DollarToken.balanceOf(address(this));
        require(contractBalance > 0, "There is no value in this contract");
        PRICE_PER_TOKEN = contractBalance / totalSupply();
    }

    function buyTokens(uint _amount) external nonReentrant {
        require(totalSupply() + _amount <= MAX_SUPPLY, "Max supply reached");
        require(
            DollarToken.allowance(msg.sender, address(this)) >= _amount * PRICE_PER_TOKEN, 
            "Insufficient allowance for tokens and fee"
        );
        bool success = DollarToken.transferFrom(msg.sender, address(this), _amount * PRICE_PER_TOKEN);
        require(success, "Token transfer failed");

        
        _mint(msg.sender, _amount);
        setPrice();
        AVAILABLE_TOKENS -= _amount;
    }

    function addCashPoint(string memory name, string memory city, int256 latitude, int256 longitude, uint accuracy, string memory phone, string memory currency, uint buy, uint sell, string memory endtime, uint duration) external nonReentrant {
        uint fee = duration * CASHPOINT_FEE;

        require(!cashpoints[msg.sender]._isCashPoint, "Already a cashpoint");
        require(
            DollarToken.allowance(msg.sender, address(this)) >= fee, 
            "Insufficient allowance for tokens and fee"
        );
        bool success = DollarToken.transferFrom(msg.sender, address(this), fee);
        require(success, "Token transfer failed");
        
        cashpoints[msg.sender] = CashPoint(name, city, latitude, longitude, accuracy, phone, currency, buy, sell, endtime, true);
        count++;
        keys[count] = msg.sender;
        setPrice();
        emit CreatedCashPoint(msg.sender);
    }

    function updateCashPoint(string memory name, string memory city, int256 latitude, int256 longitude, uint accuracy, string memory phone, string memory currency, uint buy, uint sell, string memory endtime, uint duration) external nonReentrant {
        uint fee = (duration == 0)?BASE_FEE: duration * CASHPOINT_FEE;
        require(cashpoints[msg.sender]._isCashPoint, "Not a cashpoint");
        require(
            DollarToken.allowance(msg.sender, address(this)) >= fee, 
            "Insufficient allowance for tokens and fee"
        );
        bool success = DollarToken.transferFrom(msg.sender, address(this), fee);
        require(success, "Token transfer failed");
        cashpoints[msg.sender] = CashPoint(name, city, latitude, longitude, accuracy, phone, currency, buy, sell, endtime, true);
        setPrice();
        emit UpdatedCashPoint(msg.sender);
    }

    function getCashPoint(address cp) public view returns(CashPoint memory cashpoint)
    {
      return cashpoints[cp];
    }
    

    //create a modifier that the msg.sender must be the owner
    modifier onlyOwner() {
        require(msg.sender == Owner, 'Not owner');
        _;
    }

    modifier onlyHolder() {
        require(balanceOf(msg.sender) > 0, 'Not holder');
        _;
    }
    
    function transferDollarTokens(address _to, uint _amount) public {
        bool success = DollarToken.transfer(_to, _amount); // Use transfer instead of transferFrom
        require(success, "Token transfer failed");
    }

    function checkIfICanWithdraw(uint256 _tokens) public view returns (bool)
    {
        return balanceOf(msg.sender) >= _tokens;
    }

    function checkAmountToTransfer(uint _tokens) public view returns (uint256)
    {
        uint amount = _tokens*PRICE_PER_TOKEN;
        return amount;
    }
    

    //holders can withdraw from the contract because payable was added to the state variable above
    function withdraw (uint _tokens) public onlyHolder nonReentrant{
        require(DollarToken.balanceOf(address(this))> 0, "There is no value in this contract");
        setPrice();
        require(checkIfICanWithdraw(_tokens), "You are trying to withdraw more than your stake");
        _burn(msg.sender, _tokens);
        AVAILABLE_TOKENS += _tokens;
        transferDollarTokens(msg.sender, checkAmountToTransfer(_tokens));
    }
    
    function send(uint _amount, address _to) external nonReentrant{
      uint fee = (TRANSACTION_COMMISION * _amount)/100;
      uint total = _amount + fee;
      require(
            DollarToken.allowance(msg.sender, address(this)) >= total, 
            'Insufficient allowance for transfer and fee you need '
        );
      bool success = DollarToken.transferFrom(msg.sender, address(this), total);
      require(success, "Token transfer failed");
      transferDollarTokens(_to, _amount);
      setPrice(); 
    }

}