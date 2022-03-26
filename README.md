# Polygon API

NFT creation API interfacing with the Polygon PoS blockchain.

This API:

- Generates eth/polygon wallets.
- Mints NFTs.

You can:

- Query all NFTs, a specific users NFTs, a single NFT.
- Retrieve your generated wallet private key.

-----

## Resources

- [OpenZeppelin](https://openzeppelin.com/contracts/)
- [Ethers](https://www.npmjs.com/package/ethers)
- [Hardhat](https://hardhat.org/)
- [NFT Storage](https://nft.storage/)
- [AWS](https://www.npmjs.com/package/aws-sdk)

----

## Project Structure

    .  
    ├── ...  
    ├── contracts               # NFT contracts  
    ├── resources               # DynamoDB table definition  
    ├── scripts                 # Blockchain deployment scripts  
    ├── src  
    │   ├── ...  
    │   ├── functions           # AWS lambda functions  
    │   ├── ...  
    ├── tests  
    │   ├── integration         # End-to-end, integration tests  
    │   └── unit                # Unit tests  

----- 

## Contracts

NFT ERC721 smart contract in `contracts/`. Inherits from OpenZeppelins ERC721 contract.

### To Re-Compile

`npx hardhat compile --force`

### Deploying

Currently the deploy function is in `src/scripts/` and uses the binary/abi generated from hardhat compilation in `artifacts/`. Use `npx ts-node src/scripts/deployNFTContract` to deploy a contract and visit the file itself to change the config for testnet/mainnet. In the future this function will be used to automate the process.

-----

## Middleware

[Middy](https://github.com/middyjs/middy) - middleware engine for Node.Js lambda. This template uses [http-json-body-parser](https://github.com/middyjs/middy/tree/master/packages/http-json-body-parser) to convert API Gateway `event.body` property, originally passed as a stringified JSON, to its corresponding parsed object

---

## Serverless - AWS Node.js Typescript

### Using NPM

- Run `npm i` to install the project dependencies
- Run `npx sls deploy` to deploy this stack to AWS

### Locally

In order to test the hello function locally, run the following command:

- `npx sls invoke local -f hello --path src/functions/hello/mock.json` if you're using NPM

Check the [sls invoke local command documentation](https://www.serverless.com/framework/docs/providers/aws/cli-reference/invoke-local/) for more information.
