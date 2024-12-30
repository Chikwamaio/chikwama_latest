const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect, assert } = require("chai");
require('dotenv').config();

describe("Cashpoints", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployCashpointsContract() {
    
    // Contracts are deployed using the first signer/account by default
    const [owner, addr1, addr2] = await ethers.getSigners();
    const initialSupply = 10000;

    const DollarToken = await ethers.getContractFactory("ERC20Mock");
    const amount = ethers.utils.parseUnits("100000", "ether");
    const dollarToken = await DollarToken.deploy("Dollar Token", "DOLLAR", owner.address, amount);
    await dollarToken.deployed();
  
    console.log("DollarToken contract attached at:", dollarToken.address);

    const Cashpoints = await ethers.getContractFactory("CashPoints");
    const cashpoints = await Cashpoints.deploy(dollarToken.address);

    console.log("CashPoints deployed to:", cashpoints.address);
  
    return { cashpoints, dollarToken, owner, addr1, addr2, initialSupply };

  }

  describe("Deployment", function () {

    it("Should set the right owner", async function () {
      const { cashpoints, owner } = await loadFixture(deployCashpointsContract);
      expect(await cashpoints.Owner()).to.equal(owner.address);
    });

    it("Should assign the initial supply of tokens to the owner", async function () {
      
      const { cashpoints, owner } = await loadFixture(deployCashpointsContract);
      const ownerBalance = await cashpoints.balanceOf(owner.address);
      expect(await cashpoints.totalSupply()).to.equal(ownerBalance);
    });

  
  });

  describe("Transactions", function () {

    it("Should fail if a holder tries to withdraw when there is no value in contract", async function () {
      const { cashpoints, owner, addr1, dollarToken } = await loadFixture(deployCashpointsContract);
   
      await expect(cashpoints.connect(owner).withdraw(20)).to.be.revertedWith('There is no value in this contract');
    })

    it("Should fail if a non-holder tries to withdraw", async function () {
      const { cashpoints, addr1 } = await loadFixture(deployCashpointsContract);
      await expect(cashpoints.connect(addr1).withdraw(20)).to.be.revertedWith('Not holder');
    })

    it("Should emit event when funds received", async function () {
      const { cashpoints, owner, addr1 } = await loadFixture(deployCashpointsContract);
      await expect(
      addr1.sendTransaction({ to: cashpoints.address, value: 1000 })
      ).to.emit(cashpoints, "Received")
    })

    it("Should receive funds", async function () {
      const { cashpoints, owner, addr1 } = await loadFixture(deployCashpointsContract);

      await expect(
      addr1.sendTransaction({ to: cashpoints.address, value: 1000 })
      ).to.changeEtherBalance(cashpoints.address, 1000);
    })

    it("Should fail to setPrice if there are no funds in the contract", async function () {
      const { cashpoints, owner, addr1 } = await loadFixture(deployCashpointsContract);;
      await expect(cashpoints.setPrice()).to.be.revertedWith('There is no value in this contract');
    })

    it('Should set the price correctly', async function () {
      const { cashpoints, owner, addr1, initialSupply, dollarToken } = await loadFixture(deployCashpointsContract);
      const amount = ethers.utils.parseUnits("0.5", "ether");
      await dollarToken.transfer(cashpoints.address, amount);
      
      await cashpoints.setPrice();
      const newPrice = await cashpoints.PRICE_PER_TOKEN();
  
      const price = amount/initialSupply;
      assert.equal(newPrice,price);
    })

    it('Allow only holder to withdraw all funds', async function () {
      const { cashpoints, owner, addr1, dollarToken } = await loadFixture(deployCashpointsContract);
      const tokens = 10000;
      
      const amount = ethers.utils.parseUnits("5", "ether");
      await dollarToken.transfer(cashpoints.address, amount);
      const contractBalance = await dollarToken.balanceOf(cashpoints.address);
      await cashpoints.setPrice();
      const mystake = await cashpoints.checkAmountToTransfer(tokens);

      expect(contractBalance).to.equal(mystake);

      const tokensBefore = await cashpoints.AVAILABLE_TOKENS();
      await cashpoints.withdraw(tokens);
      const tokensAfter = await cashpoints.AVAILABLE_TOKENS();
      expect(tokensBefore.add(tokens)).to.equal(tokensAfter);
      expect(await dollarToken.balanceOf(cashpoints.address)).to.equal(0);
    })

    it('Should fail if holder tries to withdraw more than their stake', async function () {
      const { cashpoints, owner, addr1, dollarToken } = await loadFixture(deployCashpointsContract);
      const tokens = 10000;
      
      const amount = ethers.utils.parseUnits("5", "ether");
      await dollarToken.transfer(cashpoints.address, amount);
      const contractBalance = await dollarToken.balanceOf(cashpoints.address);
      await cashpoints.setPrice();
      const mystake = await cashpoints.checkAmountToTransfer(tokens);

      expect(contractBalance).to.equal(mystake);
      
      await expect(cashpoints.withdraw(tokens + 1)).to.be.revertedWith('You are trying to withdraw more than your stake');

    })


    it("Should fail user tries to send the wrong amount for tokens", async function () {
      const { cashpoints, owner, addr1, dollarToken } = await loadFixture(deployCashpointsContract);
      const tokensToBuy = 1000;
      
      const amount = ethers.utils.parseUnits("5", "ether");
      await dollarToken.transfer(cashpoints.address, amount);
      await dollarToken.balanceOf(cashpoints.address);
      await cashpoints.setPrice();
      const newPrice = await cashpoints.PRICE_PER_TOKEN();
      const cost = newPrice//*tokensToBuy;
 
      await dollarToken.approve(cashpoints.address, cost)

      await expect(cashpoints.connect(addr1).buyTokens(tokensToBuy)).to.be.revertedWith('Insufficient allowance for tokens and fee');
    })

    it("Should let user buy tokens if there is value in the contract", async function () {
      const { cashpoints, owner, addr1, initialSuppl, dollarToken } = await loadFixture(deployCashpointsContract);
      const newtokens = 18000;

      const amount = ethers.utils.parseUnits("5", "ether");
      await dollarToken.transfer(cashpoints.address, amount);
      await dollarToken.balanceOf(cashpoints.address);
      await cashpoints.setPrice();

      const tokensBefore = await cashpoints.AVAILABLE_TOKENS();
      const newPrice = await cashpoints.PRICE_PER_TOKEN();
      const cost = newPrice.mul(ethers.BigNumber.from(newtokens)); 
 
      await dollarToken.approve(cashpoints.address, cost)
      const buyTokens = cashpoints.buyTokens(newtokens);
      await expect(buyTokens).to.changeTokenBalance(
        cashpoints,
        owner,
        newtokens
      );
      const tokensAfter = await cashpoints.AVAILABLE_TOKENS();
      expect(tokensBefore.sub(newtokens)).to.equal(tokensAfter);
    });

    
    
    it("Should let user create and update a cashpoint", async function () {
      const { cashpoints, owner, addr1, addr2, initialSupply, dollarToken } = await loadFixture(deployCashpointsContract);

      const duration = 10;
      const name = 'Alpha';
      const city = 'Blantyre';
      const phone = ethers.utils.parseUnits("0996971997", "ether");
      const currency = 'MWK, Malawi Kwacha';
      const buy = ethers.utils.parseUnits("1000", "ether");
      const sell = ethers.utils.parseUnits("1025", "ether"); 
      const now = new Date();
      const endtime =  new Date(now.setDate(now.getDate() + duration));
      const latitude = ethers.utils.parseUnits("-15.7801", "ether");
      const longitude = ethers.utils.parseUnits("35.0190", "ether");
      
      const accuracy = 50; // Example accuracy in meters
      const fee = await cashpoints.CASHPOINT_FEE();
      const basefee = await cashpoints.BASE_FEE();
      const cost = fee.mul(duration);
      await dollarToken.approve(cashpoints.address, cost)

      const balanceBefore = await dollarToken.balanceOf(owner.address)
      const addCashPoint = await cashpoints.addCashPoint(
        name, city, latitude, longitude, accuracy, phone, currency, buy, sell, endtime.toString(), duration
      );
      const balanceAfter = await dollarToken.balanceOf(owner.address)
      expect(balanceBefore.sub(cost)).to.equal(balanceAfter);
      await expect(addCashPoint).to.emit(cashpoints, "CreatedCashPoint").withArgs(owner.address);

      const newEndTime =  new Date(endtime.setDate(endtime.getDate() + duration));
      await dollarToken.approve(cashpoints.address, basefee);
      const updateCashPoint = cashpoints.updateCashPoint(
        name, city, latitude, longitude, accuracy, phone, currency, buy, sell, endtime.toString(), 0
      );
      await expect(updateCashPoint).to.emit(cashpoints, "UpdatedCashPoint").withArgs(owner.address);

    });

    it("Should let users route transfers through the contract for a fee", async function () {
      const { cashpoints, owner, addr1, addr2, initialSupply, dollarToken } = await loadFixture(deployCashpointsContract);
      
      const amount = ethers.utils.parseUnits("10", "ether");
      await dollarToken.transfer(cashpoints.address, amount);

      const fee = await cashpoints.TRANSACTION_COMMISION();
      // Calculate the fee as a percentage of the amount
      let cost = fee.div(100).mul(amount);
      let total = amount.add(cost);
    
      // Approve the contract to spend the total amount (amount + fee)
      await dollarToken.approve(cashpoints.address, total);
    
  
    
      // Check the balances before and after the transaction
      const ownerBalanceBefore = await dollarToken.balanceOf(owner.address);
      const addr2BalanceBefore = await dollarToken.balanceOf(addr2.address);
      const contractBalanceBefore = await dollarToken.balanceOf(cashpoints.address);
    
      // Perform the transfer
      await cashpoints.send(amount, addr2.address);
    
      const ownerBalanceAfter = await dollarToken.balanceOf(owner.address);
      const addr2BalanceAfter = await dollarToken.balanceOf(addr2.address);
      const contractBalanceAfter = await dollarToken.balanceOf(cashpoints.address);
      // Check if the balances changed as expected
      expect(ownerBalanceBefore.sub(ownerBalanceAfter)).to.equal(total);
      expect(addr2BalanceAfter.sub(addr2BalanceBefore)).to.equal(amount);
      expect(contractBalanceAfter.sub(contractBalanceBefore)).to.equal(cost);
    });

    


  })
});
