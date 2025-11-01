//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
contract Tokenizer is ERC1155{
    string private BASE_URL;
    uint256 assetToken=1;
    address private admin;
    mapping(bytes12=>uint256) public totalAssetTokenSupplyMap;
    mapping(bytes12=>uint256) public assetTokenMap;
    event AssetTokenized(bytes12 indexed assetID);
    event AssetTokenTransferred(address indexed fromAccount,address indexed toAccount,bytes12 indexed assetID,uint amount);
    constructor(string memory _BASE_URL,address adminAddress) ERC1155(""){
        require(bytes(_BASE_URL).length>0,"BASE URL INVALID");
        BASE_URL=_BASE_URL;
        admin=adminAddress;
    }
    function uri(uint256 tokenID)public view override returns(string memory){
        return string(abi.encodePacked(BASE_URL,tokenID,"/"));
    }
    function mintAssetTokens(bytes12 assetID,uint amount)
    public{
        require(totalAssetTokenSupplyMap[assetID]==0,"Asset Already Tokenized");
        if(assetTokenMap[assetID]==0){
            assetTokenMap[assetID]=assetToken;
            assetToken++;
        }
        _mint(msg.sender,assetTokenMap[assetID],amount,"");
        totalAssetTokenSupplyMap[assetID]=amount;
        emit AssetTokenized(assetID);
        emit AssetTokenTransferred(address(0x0),msg.sender,assetID,amount);
    }
    function getAssetTokenBalance(address fromAddress,bytes12 assetID) public view returns(uint256){
        return balanceOf(fromAddress,assetTokenMap[assetID]);
    }
    function getAssetTokenTotalSupply(bytes12 assetID) public view returns(uint256){
        return(totalAssetTokenSupplyMap[assetID]);
    }
    function claimAssetToken(bytes12 assetID, uint256 amount) public {
        _safeTransferFrom(admin, msg.sender, assetTokenMap[assetID], amount, "");
    emit AssetTokenTransferred(admin, msg.sender, assetID, amount);
    }
    function burnAssetToken(uint256 amount,bytes12 assetID) public{
        _burn(msg.sender,assetTokenMap[assetID],amount);
    }
}