import {
  Client,
  PrivateKey,
  AccountCreateTransaction,
  Hbar,
  TokenMintTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TransferTransaction,
  TokenAssociateTransaction,
} from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  //Grab your Hedera testnet account ID and private key from your .env file
  const myAccountId = process.env.OPERATOR_ID;
  const myPrivateKey = process.env.OPERATOR_KEY;
  const myKey = PrivateKey.fromString(myPrivateKey);

  // If we weren't able to grab it, we should throw a new error
  if (myAccountId == null || myPrivateKey == null) {
    throw new Error(
      "Environment variables myAccountId and myPrivateKey must be present"
    );
  }

  // Create our connection to the Hedera network
  // The Hedera JS SDK makes this really easy!
  const client = Client.forTestnet();
  client.setOperator(myAccountId, myPrivateKey);

  //Create alice account
  const alicePrivateKey = await PrivateKey.generateED25519();
  //Create a new account with 1,000 tinybar starting balance
  const aliceAccount = await new AccountCreateTransaction()
    .setKey(alicePrivateKey.publicKey)
    .setInitialBalance(Hbar.from(100))
    .execute(client);

  // Get the new account ID
  let getReceipt = await aliceAccount.getReceipt(client);
  let aliceAccountId = getReceipt.accountId;
  console.log("Alice account ID is: " + aliceAccountId);

  //Create bob account
  const bobPrivateKey = await PrivateKey.generateED25519();
  //Create a new account with 1,000 tinybar starting balance
  const bobAccount = await new AccountCreateTransaction()
    .setKey(bobPrivateKey.publicKey)
    .setInitialBalance(Hbar.from(100))
    .execute(client);

  // Get the new account ID
  getReceipt = await bobAccount.getReceipt(client);
  const bobAccountId = getReceipt.accountId;
  console.log("Bob account ID is: " + bobAccountId);

  // Create NFT token
  let tokenCreateTx = await new TokenCreateTransaction()
    .setTokenName("MyToken")
    .setTokenSymbol("MT")
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(myAccountId)
    .setSupplyType(TokenSupplyType.Infinite)
    .setSupplyKey(myKey)
    .setAdminKey(myKey)
    .freezeWith(client);
  let tokenCreateSign = await tokenCreateTx.sign(myKey);
  let tokenCreateSubmit = await tokenCreateSign.execute(client);
  let tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
  let tokenId = tokenCreateRx.tokenId;
  console.log("NFT Token ID", tokenId.toString());

  // Mint 2 NFT Tokens
  let mintTx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setMetadata([
      Buffer.from("FirstTokenMetadata"),
      Buffer.from("SecoudTokenMetadata"),
    ])
    .freezeWith(client);

  let mintTxSign = await mintTx.sign(myKey);
  let mintTxSubmit = await mintTxSign.execute(client);
  let mintReceipt = await mintTxSubmit.getReceipt(client);
  console.log("Minted token status: ", mintReceipt.status.toString());

  // Associate token to alice and bob account
  let associateTx = await new TokenAssociateTransaction()
    .setAccountId(aliceAccountId)
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(alicePrivateKey);
  let associateTxSubmit = await associateTx.execute(client);
  let receipt = await associateTxSubmit.getReceipt(client);
  console.log(
    "Associate token with Alice account status",
    receipt.status.toString()
  );

  associateTx = await new TokenAssociateTransaction()
    .setAccountId(bobAccountId)
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(bobPrivateKey);
  associateTxSubmit = await associateTx.execute(client);
  receipt = await associateTxSubmit.getReceipt(client);
  console.log(
    "Associate token with Bob account status",
    receipt.status.toString()
  );

  // Transfer first token to Alice
  let tokenTransferTx = await new TransferTransaction()
    .addNftTransfer(tokenId, 1, myAccountId, aliceAccountId)
    .freezeWith(client)
    .sign(myKey);
  let tokenTranferSubmit = await tokenTransferTx.execute(client);
  let tokenTransferReceipt = await tokenTranferSubmit.getReceipt(client);
  console.log(
    "Transfer first token status",
    tokenTransferReceipt.status.toString()
  );

  // Transfer second token to Bob
  tokenTransferTx = await new TransferTransaction()
    .addNftTransfer(tokenId, 2, myAccountId, aliceAccountId)
    .freezeWith(client)
    .sign(myKey);
  tokenTranferSubmit = await tokenTransferTx.execute(client);
  tokenTransferReceipt = await tokenTranferSubmit.getReceipt(client);
  console.log(
    "Transfer second token status",
    tokenTransferReceipt.status.toString()
  );

  // Trying to transfer the first token to Bob again should fail
  // Uncomment the following code if you want to try

  //   tokenTransferTx = await new TransferTransaction()
  //     .addNftTransfer(tokenId, 1, myAccountId, aliceAccountId)
  //     .freezeWith(client)
  //     .sign(myKey);
  //   tokenTranferSubmit = await tokenTransferTx.execute(client);
  //   tokenTransferReceipt = await tokenTranferSubmit.getReceipt(client);
  //   console.log(
  //     "Transfer first token status (should fail)",
  //     tokenTransferReceipt.status.toString()
  //   );
}
main();
