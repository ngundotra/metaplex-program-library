import {
    PublicKey,
    Connection,
    Keypair,
} from '@solana/web3.js';
// import {} from '@soalna'
import {
    EntangledPair,
    EntangledPairArgs
} from '../src/generated/accounts/index'


async function main() {
    console.log("Hello world!");

    const epArgs: EntangledPairArgs = {
        treasuryMint: Keypair.generate().publicKey,
        mintA: Keypair.generate().publicKey,
        mintB: Keypair.generate().publicKey,
        authority: Keypair.generate().publicKey,
        tokenAEscrow: Keypair.generate().publicKey,
        tokenBEscrow: Keypair.generate().publicKey,
        tokenAEscrowBump: 0,
        tokenBEscrowBump: 0,
        bump: 0,
        price: 0,
        paysEveryTime: false,
        paid: false,
    };
    let ep = EntangledPair.fromArgs(epArgs);

    console.log("Entangled Pair", ep);
}

main();