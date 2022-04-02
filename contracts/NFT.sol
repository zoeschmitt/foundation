//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721URIStorage, ERC721Royalty {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    string _tokenURI;

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {}

    function mintNFT(address recipient, string memory uri, uint96 royalty)
        public
        returns (uint256)
    {
        _tokenURI = uri;
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _safeMint(recipient, newItemId);
        _setTokenURI(newItemId, uri);
        _setDefaultRoyalty(recipient, royalty);

        return newItemId;
    }

    function contractURI() public view returns (string memory) {
        return _tokenURI;
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721Royalty, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
