'use strict';
const timeTravel = (time) => web3.currentProvider.send({
  jsonrpc: "2.0", method: "evm_increaseTime",
  params: [time], id: new Date().getTime()
})

const mineBlock = () => web3.currentProvider.send({
  jsonrpc: "2.0", method: "evm_mine"
})

const skip = (days) => { timeTravel(days*86400+60); mineBlock(); }
const now = () => web3.eth.getBlock(web3.eth.blockNumber).timestamp;
const evm = (p) => web3.currentProvider.send({ jsonrpc: "2.0", method: p } )
const evm_params = (p,par) => web3.currentProvider.send({
  jsonrpc: "2.0", method: p, params: par
})

var PreSaleZNA = artifacts.require('PreSaleZNA.sol');
var ZenomeCrowdSale = artifacts.require('ZenomeCrowdSale.sol');
//-----------------------------------------------------------------------

contract('TokenSale', function(accounts) {

  let [p0, p1, p2] = accounts;

  let sale, token;
  let HARDCAP;
  let nowTime,  startTime, endTime, delta;


  const print_time = (label, time) => {
    console.log("      ", label, ": ", time/(24*60*60), " days.");
  }

  async function print_completed() {
    let total = await token.totalSupply();
    console.log("       Total Amount: ", 100*total/HARDCAP, "% of HARDCAP.");
  }


  describe("Default Values", function(){

    it('Deploy', async function() {
      token = await PreSaleZNA.new();
      sale  = await ZenomeCrowdSale.new(token.address);
      await token.setMinter(sale.address);
    });

    it('HARDCAP', async function() {
      HARDCAP = await sale.HARDCAP();
      await console.log('       HARDCAP:', HARDCAP+'');
    });

    it('Time', async function() {
      let time = await sale.START_TIME().then(x=>x.toString());
      let dateTime = await new Date(+time*1000);
      console.log("      START", dateTime)
      print_time("DURAT", await sale.CLOSE_TIME() - await sale.START_TIME());
    });

  });


  describe("Token Contract", function() {

    it("Deploy Contact", async function(){
      token = await PreSaleZNA.new();
      let total = await token.totalSupply();
      await console.log("      ", 'Total amount', await total.toString() );
    })

    it("Setting Minter By Non-Owner failed", async function(){
      try { await token.setMinter(accounts[0], {from: accounts[1]}); }
      catch (e) { return }
      assert.ok(false);
    })

    it("Setting Minter By Owner", async function(){
      await token.setMinter(accounts[1], {from: accounts[0]});
    })

    it("Minter Mints", async function(){
      await token.mint(accounts[1], 1000, {from: accounts[1]});
      let total = await token.totalSupply();
      await console.log("      ", 'Total amount', await total.toString() );
    })

    it("Non-Minter minting failed", async function(){
      try { await token.mint(accounts[0], {from: accounts[2]}); }
      catch (e) { return }
      assert.ok(false);
    })

    it("Get Balance", async function(){
      await console.log("      ", 'Account 0:', await token.balanceOf(accounts[0]).then(x=>x.toString()) ,
                        "      ", 'Account 1:', await token.balanceOf(accounts[1]).then(x=>x.toString()) ,
                        "      ", 'Account 2:', await token.balanceOf(accounts[2]).then(x=>x.toString()) );
    })

    it("Transfer Doesnt Work By Default", async function(){
      try { await token.transfer(accounts[2], 1000, {from: accounts[1]}); }
      catch (e) { return }
      assert.ok(false);
    })


    it("Transfer Is Turning By non-owner failed", async function(){
      try { await token.unpause({from: accounts[1]}); }
      catch (e) { return }
      assert.ok(false);
    });

    it("Transfer Is Turning By Owner", async function(){
      await token.unpause({from: accounts[0]});
    });

    it("Transfer From account 1 to account 2", async function(){
      await token.transfer(accounts[2], 1000, {from: accounts[1]});
      await console.log("      ", 'Account 1:', await token.balanceOf(accounts[1]).then(x=>x.toString()) );
      await console.log("      ", 'Account 2:', await token.balanceOf(accounts[2]).then(x=>x.toString()) );
    });

    it("Transfer Is Turning Off By Owner", async function(){
      await token.pause({from: accounts[0]});
    });

    it("Transfer Doesnt Work", async function(){
      try { await token.transfer(accounts[1], 1000, {from: accounts[2]}); }
      catch (e) { return }
      assert.ok(false);
    })


  });


  describe("Crowdsale Contract", function(){

    it('Deploy Contact', async function() {
      token = await PreSaleZNA.new();
      sale  = await ZenomeCrowdSale.new(token.address);
      await token.setMinter(sale.address);
      nowTime = await now();
    });

    describe('Setting Time Interval', function(){

      it('Not set when close < start', async function() {
        try { await sale.setTime(nowTime+3*24*60*60, nowTime+2*24*60*60); }
        catch (e) { return }
        assert.ok(false);
      });


      it('Set by not-owner', async function() {
        try { await sale.setTime(await now()+1*24*60*60,
                                 await now()+2*24*60*60, {from: p2}); }
        catch (e) { return }
        assert.ok(false);
      });

      it('Set when close > start', async function() {
        await sale.setTime(nowTime+1*24*60*60, nowTime+2*24*60*60);
      });

      it('Set when close > now > start', async function() {
        await sale.setTime(nowTime-1*24*60*60, nowTime+2*24*60*60);
      });

    });


    describe('Change Exchange Rate', function(){

      it('Set when close > start', async function() {
        await sale.setTime(nowTime+1*24*60*60, nowTime+2*24*60*60);
      });

      it('Set Exchange Rate to 1000', async function() {
        await sale.setExchangeRate(1000);
        assert.ok(await sale.exchangeRate() == 1000);
      });

      it('Set when close > now > start', async function() {
        await sale.setTime(nowTime-1*24*60*60, nowTime+2*24*60*60);
      });

      it('Set Exchange Rate fails during crowdsale', async function() {
        try { await sale.setExchangeRate(1000); } catch (err) { return }
        assert.ok(false);
      });



      it('should forward funds to wallet', async function() {
        let wallet = await sale.wallet()
        let pre = await web3.eth.getBalance(wallet)
        await sale.send(1000000*1000000000000000);
        let post = await web3.eth.getBalance(wallet)
        await console.log("       Delta Wallet Balance:", post-pre );
        await print_completed();
      });


      it('Set when close > start', async function() {
        await sale.setTime(nowTime+1*24*60*60, nowTime+2*24*60*60);
      });

      it('Set Exchange Rate to 100', async function() {
        await sale.setExchangeRate(100);
        assert.ok(await sale.exchangeRate() == 100);
      });

      it('Set Exchange Rate to 100', async function() {
        try { await sale.setExchangeRate(100, {from:p2}); } catch (e) {return}
        assert.ok(false);

      });

      it('Set when close > now > start', async function() {
        await sale.setTime(nowTime-1*24*60*60, nowTime+2*24*60*60);
      });

      it('should forward funds to wallet', async function() {
        let wallet = await sale.wallet()
        let pre = await web3.eth.getBalance(wallet)
        await sale.send(1000000*1000000000000000);
        let post = await web3.eth.getBalance(wallet)
        await console.log("       Delta Wallet Balance:", post-pre );
        await print_completed();
      });

    })

  })


  describe("1. Failed Crowdsale ", function(){

    it('Deploy', async function() {
      token = await PreSaleZNA.new();
      sale  = await ZenomeCrowdSale.new(token.address);
      await token.setMinter(sale.address);

      // Print Token Amount
      HARDCAP = await sale.HARDCAP();
      await print_completed();
    });

    it('Buying tokens before the start: should fail.', async function() {
      try { await sale.send(1000000); } catch (error) { return }
      assert.ok(false);
    });

    it('Buying tokens after the end: should fail.', async function() {
      await skip(3);
      try { await sale.send(1000000); } catch (error) { return }
      assert.ok(false);
    });

    it('Bonuses Failed: not sold out', async function() {
      try { await sale.transferBonuses(p0); } catch (error) { return }
      assert.ok(false);
    });

  });


  describe("2.Undercap Crowdsale ", function(){

    afterEach(async function() { await print_completed(); });

    it('Deploy', async function() {
      token = await PreSaleZNA.new();
      sale  = await ZenomeCrowdSale.new(token.address);
      await token.setMinter(sale.address);
      await sale.setTime( await now()+1*24*60*60, await now()+4*24*60*60 );
    });

    it('Time travel + Buy tokens.', async function() {
      await skip(3);
      await sale.send(1000000 * 3000000000000000);
    });

    it('Buy 0 tokens', async function() {
      try { await sale.buyTokens(p1, {value: 0}); } catch (e) { return }
      assert.ok(false);
    });

    it('Time travel + Bonuses Failed: not sold out', async function() {
      await skip(3);
      try { await sale.transferBonuses(p0); } catch (error) { return }
      assert.ok(false);
    });

  });


  describe("3.Best Crowdsale ", function(){

    afterEach(async function() { await print_completed(); });

    it('Deploy', async function() {
      token = await PreSaleZNA.new();
      sale  = await ZenomeCrowdSale.new(token.address);
      await token.setMinter(sale.address);
      await sale.setTime( await now()+1*24*60*60, await now()+4*24*60*60 );
      await skip(3);
    });

    it('Buy tokens.', async function() { await sale.send(1000000*3000000000000000);});
    it('Buy tokens.', async function() { await sale.send(1000000*500000000000000); });
    it('Buy tokens: sold out', async function() {
      try { await sale.send(1000000*500000000000000); } catch (error) { return }
      assert.ok(false);
    });

    it('Bonuses: sold out', async function() { await sale.transferBonuses(p0); });
    it('Bonuses: failded empty acc', async function() {
      try { await sale.transferBonuses(p1); } catch (error) { return }
      assert.ok(false);
    });

  });

});
