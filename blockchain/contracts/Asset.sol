// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;
contract Asset{
    mapping(bytes12=>bytes32) public assetMap;
    event assetAdded(address indexed user,bytes12 indexed assetID);
    event assetModified(address indexed user,bytes12 indexed assetID);
    event assetDeleted(address indexed user,bytes12 indexed assetID);
    event TrustedBackendSignerChanged(address newAddress);
    function addAsset(bytes12 assetID,bytes32 assetHash) public {
        require(assetMap[assetID]==0,"Asset Already Exists");
        assetMap[assetID]=assetHash;
        emit assetAdded(msg.sender, assetID);
    }
    function modifyAsset(bytes12 assetID,bytes32 newAssetHash) public{
        require(assetMap[assetID]!=0,"Asset Does Not Exist");
        assetMap[assetID]=newAssetHash;
    }
    function deleteAsset(bytes12 assetID) public {
        require(assetMap[assetID]!=0,"Asset Does Not Exist");
        assetMap[assetID]=0;
    }
    function getAssetHash(bytes12 assetID) public view  returns (bytes32){
        require(assetMap[assetID] != 0, "Asset Does Not Exist");
        return(assetMap[assetID]);
    }
}