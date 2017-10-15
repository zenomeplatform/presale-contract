var PreSaleZNA = artifacts.require("PreSaleZNA");
var ZenomeCrowdSale = artifacts.require("ZenomeCrowdSale");

module.exports = function(deployer, network, address) {

  var token, sale;
  var wallet = 0;

  if (network == 'development'){
    wallet = "0x627df050688d3681b99c096427fd8719d2ffb7e1";
  }
  if (network == 'rinkeby'){
    wallet = "0x347C693c2df7A1Dff974a07A68fAA436B485BDBb";
  }
  if (network == 'mainnet'){
    wallet = "0x7BFE0278Aab06F21a35E04929d71f48A35d5504F";
  }

  deployer.then(
    function(){
      return PreSaleZNA.new()
    }
  ).then(
    function(_token){
      token = _token;
      deployer.deploy(ZenomeCrowdSale, token.address, wallet).then(
        function(){
          token.setMinter(ZenomeCrowdSale.address);
        }
      );
    }
  )



};
