pragma solidity ^0.4.15;
import "../node_modules/zeppelin-solidity/contracts/token/MintableToken.sol";
import "../node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "./PreSaleZNA.sol";

/**
 * @title Zenome Crowdsale contract
 * @dev Govern the presale:
 *   1) Taking place in a specific limited period of time.
 *   2) Having HARDCAP value set --- a number of sold tokens to end the pre-sale
 *
 * Owner can change time parameters at any time --- just in case of emergency
 * Owner can change minter at any time --- just in case of emergency
 *
 * !!! There is no way to change the address of the wallet !!!
 */
contract ZenomeCrowdSale is Ownable {

    // Use SafeMath library to provide methods for uint256-type vars.
    using SafeMath for uint256;

    // The hardcoded address of wallet
    address public wallet;

    // The address of presale token
    PreSaleZNA public token;// = new PreSaleZNA();

    // The accounting mapping to store information on the amount of
    // bonus tokens that should be given in case of successful presale.
    mapping(address => uint256) bonuses;

    /**
     * @dev Variables
     *
     * @public START_TIME uint the time of the start of the sale
     * @public CLOSE_TIME uint the time of the end of the sale
     * @public HARDCAP uint256 if @HARDCAP is reached, presale stops
     * @public the amount of indivisible quantities (=10^18 ZBA) given for 1 wie
     */
    uint public START_TIME = 1508256000;
    uint public CLOSE_TIME = 1508860800;
    uint256 public HARDCAP = 3200000000000000000000000;
    uint256 public exchangeRate = 966;


    /**
     * Fallback function
     * @dev The contracts are prevented from using fallback function.
     *   That prevents loosing control of tokens that will eventually get
     *      attributed to the contract, not the user
     *   To buy tokens from the wallet (that is a contract)
     *      user has to specify beneficiary of tokens using buyTokens method.
     */
    function () payable {
      require(msg.sender == tx.origin);
      buyTokens(msg.sender);
    }

    /**
     * @dev A function to withdraw all funds.
     *   Normally, contract should not have ether at all.
     */
    function withdraw() onlyOwner {
      wallet.transfer(this.balance);
    }

    /**
     * @dev The constructor sets the tokens address
     * @param _token address
     */
    function ZenomeCrowdSale(address _token, address _wallet) {
      token  = PreSaleZNA(_token);
      wallet = _wallet;
    }


    /**
     * event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param beneficiary who got the tokens
     * @param value weis paid for purchase
     * @param amount amount of tokens purchased
     */
    event TokenPurchase(
      address indexed purchaser,
      address indexed beneficiary,
      uint256 value,
      uint256 amount
     );

    /**
     * event for bonus processing logging
     * @param beneficiary a user to get bonuses
     * @param amount bonus tokens given
     */
    event TokenBonusGiven(
      address indexed beneficiary,
      uint256 amount
     );


    /**
     * @dev Sets the start and end of the sale.
     * @param _start uint256 start of the sale.
     * @param _close uint256 end of the sale.
     */
    function setTime(uint _start, uint _close) public onlyOwner {
      require( _start < _close );
      START_TIME = _start;
      CLOSE_TIME = _close;
    }

    /**
     * @dev Sets exhange rate, ie amount of tokens (10^{-18}ZNA) for 1 wie.
     * @param _exchangeRate uint256 new exhange rate.
     */
    function setExchangeRate(uint256 _exchangeRate) public onlyOwner  {
      require(now < START_TIME);
      exchangeRate = _exchangeRate;
    }


    /**
     * @dev Buy tokens for all sent ether.
     *      Tokens will be added to beneficiary's account
     * @param beneficiary address the owner of bought tokens.
     */
    function buyTokens(address beneficiary) payable {

      uint256 total = token.totalSupply();
      uint256 amount = msg.value;
      require(amount > 0);

      // Check that hardcap not reached, and sale-time.
      require(total < HARDCAP);
      require(now >= START_TIME);
      require(now <  CLOSE_TIME);

      // Mint tokens bought for all sent ether to beneficiary
      uint256 tokens = amount.mul(exchangeRate);
      token.mint(beneficiary, tokens);
      TokenPurchase(msg.sender, beneficiary,amount, tokens);

      // Calcualate the corresponding bonus tokens,
      //  that can be given in case of successful pre-sale
      uint256 _bonus = tokens.div(4);
      bonuses[beneficiary] = bonuses[beneficiary].add(_bonus);

      // Finally, sent all the money to wallet
      wallet.transfer(amount);
    }


    /**
     * @dev Process bonus tokens for beneficiary in case of all tokens sold.
     * @param beneficiary address the user's address to process.
     *
     * Everyone can call this method for any beneficiary:
     *  1) Method (code) does not depend on msg.sender =>
     *         => side effects don't depend on the caller
     *  2) Calling method for beneficiary is either positive or neutral.
     */
    function transferBonuses(address beneficiary) {
      // Checks that sale has successfully ended by having all tokens sold.
      uint256 total = token.totalSupply();
      require( total >= HARDCAP );

      // Since the number of bonus tokens that are intended for beneficiary
      //    was pre-calculated beforehand, set variable "tokens" to this value.
      uint256 tokens = bonuses[beneficiary];
      // Chech if there are tokens to give as bonuses
      require( tokens > 0 );

      // If so, make changes the accounting mapping. Then mint bonus tokens
      bonuses[beneficiary] = 0;
      token.mint(beneficiary, tokens);

      // After all, log event.
      TokenBonusGiven(beneficiary, tokens);
    }
}
