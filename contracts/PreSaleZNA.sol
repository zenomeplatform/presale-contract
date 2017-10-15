pragma solidity ^0.4.15;
import "../node_modules/zeppelin-solidity/contracts/token/MintableToken.sol";
import "../node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol";

/**
 * @title PreSale ZNA token
 * @dev The minting functionality is reimplemented, as opposed to inherited
 *   from MintableToken, to allow for giving right to mint to arbitery account.
 */
contract PreSaleZNA is StandardToken, Ownable, Pausable {

  // Disable transfer unless explicitly enabled
  function PreSaleZNA(){ paused = true; }

  // The address of the contract or user that is allowed to mint tokens.
  address public minter;

  /**
   * @dev Set the address of the minter
   * @param _minter address to be set as minter.
   *
   * Note: We also need to implement "mint" method.
   */
  function setMinter(address _minter) onlyOwner {
      minter = _minter;
  }

  /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(address _to, uint256 _amount) public returns (bool) {
    require(msg.sender == minter);

    totalSupply = totalSupply.add(_amount);
    balances[_to] = balances[_to].add(_amount);

    Transfer(0x0, _to, _amount);
    return true;
  }


  /**
   * @dev account for paused/unpaused-state.
   */
  function transfer(address _to, uint256 _value)
  public whenNotPaused returns (bool) {
    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _value)
  public whenNotPaused returns (bool) {
    return super.transferFrom(_from, _to, _value);
  }


  /**
   * @dev Token meta-information
   * @param name of the token as it's shown to user
   * @param symbol of the token
   * @param decimals number
   * Number of indivisible tokens that make up 1 ZNA = 10^{decimals}
   */
  string public constant name = "Presale ZNA Token";
  string public constant symbol = "pZNA";
  uint8  public constant decimals = 18;
}
