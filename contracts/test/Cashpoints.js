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
      const amount = ethers.utils.parseUnits("100", "ether");
      await dollarToken.transfer(cashpoints.address, amount);
      
      await cashpoints.setPrice();
      const newPrice = await cashpoints.PRICE_PER_TOKEN();
  
      const price = amount/initialSupply;
      assert.equal(newPrice,price);
    })

    it('Allow only holder to withdraw all funds', async function () {
      const { cashpoints, owner, addr1 } = await loadFixture(deployCashpointsContract);
      const tokens = 10000;
      
      await addr1.sendTransaction({ to: cashpoints.address, value: 10000 });
      const contractBalance = await ethers.provider.getBalance(cashpoints.address);

      await expect(cashpoints.connect(owner).withdraw(tokens)).to.changeEtherBalance(cashpoints.address, -contractBalance);
      expect(await cashpoints.totalSupply()).to.equal(0);
      const availabletokens = await cashpoints.AVAILABLE_TOKENS();
      assert.equal(availabletokens, 100000);

    })

    it('Should fail if holder tries to withdraw more than their stake', async function () {
      const { cashpoints, owner, addr1 } = await loadFixture(deployCashpointsContract);
      const amount = ethers.utils.parseUnits("2", "ether");
      
      await addr1.sendTransaction({ to: cashpoints.address, value: amount });
      await expect(cashpoints.connect(owner).withdraw(ethers.utils.parseUnits("2.1", "ether"))).to.be.revertedWith('You are trying to withdraw more than your stake');
    })


    it("Should fail user tries to send the wrong amount for tokens", async function () {
      const { cashpoints, owner, addr1 } = await loadFixture(deployCashpointsContract);
      const amount = ethers.utils.parseUnits("2", "ether");
      await addr1.sendTransaction({ to: cashpoints.address, value: amount });
      await expect(cashpoints.connect(addr1).buyTokens(20, { value: ethers.utils.parseUnits("2", "ether")})).to.be.revertedWith('You are sending the wrong amount to this contract');
    })

    it("Should let user buy tokens if there is value in the contract", async function () {
      const { cashpoints, owner, addr1, initialSupply } = await loadFixture(deployCashpointsContract);
      const newtokens = 18000;
      const amount = ethers.utils.parseUnits("10", "ether");
      
      await addr1.sendTransaction({ to: cashpoints.address, value: amount });
      
      await cashpoints.setPrice();
      const newPrice = await cashpoints.PRICE_PER_TOKEN();
      let cost = ethers.utils.formatEther(newPrice) * newtokens;
      const buyTokens = cashpoints.connect(addr1).buyTokens(newtokens, { value: ethers.utils.parseUnits(cost.toString(), "ether")});
      await expect(buyTokens).to.changeTokenBalance(
        cashpoints,
        addr1,
        newtokens
      );
      const totalSupply = await cashpoints.totalSupply();
      const contractBalance = await ethers.provider.getBalance(cashpoints.address);
      const availabletokens = await cashpoints.AVAILABLE_TOKENS();
      assert.equal( totalSupply, initialSupply + newtokens);
      assert.equal(ethers.utils.formatEther(contractBalance), parseInt(ethers.utils.formatEther(amount)) + cost);
      assert.equal(availabletokens, 90000-newtokens);
    });

    
    
    it("Should let user create and update a cashpoint", async function () {
      const { cashpoints, owner, addr1, addr2, initialSupply } = await loadFixture(deployCashpointsContract);
      const amount = ethers.utils.parseUnits("10", "ether");
      
      await addr1.sendTransaction({ to: cashpoints.address, value: amount });
      const duration = 10;
      const name = 'Alpha';
      const city = 'blantyre'
      const phone = ethers.utils.parseUnits("0996971997", "ether");
      const currency = 'MWK, Malawi Kwacha';
      const buy = ethers.utils.parseUnits("1000", "ether");
      const sell = ethers.utils.parseUnits("1025", "ether"); 
      const now = new Date();
      const endtime =  new Date(now.setDate(now.getDate() + duration));
      const fee = await cashpoints.CASHPOINT_FEE();
      let cost = ethers.utils.formatEther(fee) * duration;
      const addCashPoint = cashpoints.connect(addr2).addCashPoint(name, city, phone, currency, buy, sell, endtime.toString(), duration, { value: ethers.utils.parseUnits(cost.toString(), "ether")});
      await expect(addCashPoint).to.emit(cashpoints, "CreatedCashPoint").withArgs(addr2.address);
      const newEndTime =  new Date(endtime.setDate(endtime.getDate() + duration));
      const updateCashPoint = cashpoints.connect(addr2).updateCashPoint(name, city, phone, currency, buy, sell, newEndTime.toString(), 0, { value: ethers.utils.parseUnits((0).toString(), "ether")});
      await expect(updateCashPoint).to.emit(cashpoints, "UpdatedCashPoint").withArgs(addr2.address);
      //console.log(await cashpoints.getCashPoint(addr2.address));
      // await expect(addCashPoint).to.changeEtherBalance(
      //   cashpoints,
      //   cost
      // );
    });

    it("Should let users route transfers through the contract for a fee", async function () {
      const { cashpoints, owner, addr1, addr2, initialSupply } = await loadFixture(deployCashpointsContract);
      const amount = ethers.utils.parseUnits("10", "ether");

      const fee = await cashpoints.TRANSACTION_COMMISION();
      let cost = (parseInt(fee.toString())/100) * amount;
      let total = parseInt(amount) + parseInt(cost);
      const sendXdai = cashpoints.connect(addr1).send(amount, addr2.address, { value: ethers.BigNumber.from(total.toString()) });
      await expect(sendXdai).to.changeEtherBalances([addr1.address, addr2.address], [ethers.utils.parseUnits("-10.1", "ether"), ethers.utils.parseUnits("10", "ether")]);
      const contractBalance = await ethers.provider.getBalance(cashpoints.address);
      assert.equal(contractBalance.toString(), cost.toString());
      // await expect(addCashPoint).to.changeEtherBalance(
      //   cashpoints,
      //   cost
      // );
    });

    


  })
});
