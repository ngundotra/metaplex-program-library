import { Provider, Program, Idl } from "@project-serum/anchor";
import { SystemProgram, Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { airdrop } from '@metaplex-foundation/amman';
import { TokenFuser } from '../types/token_fuser';
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';
import { NATIVE_MINT } from '@solana/spl-token';
import { BN } from "bn.js";
import { mintNFT } from '../mpl/commands/mint-nft';
import test from 'tape';
import { readFileSync } from 'fs';

const NFT_URL = "https://arweave.net/lzY_4nfg9cWziM2vDd_SXTzdHDAMguNnNO1hHDRQwZM";
const FILTER_URL = "https://arweave.net/v3qUWmuUQN8S6aMAeTeoKw14rp6YNoqg6lDDGB7Gfv8";

const setupPrereqs = async () => {
    const connection = new Connection("http://localhost:8899", { commitment: "confirmed" });
    const keypairPath = `${process.env.HOME}/.config/solana/id.json`;
    const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(keypairPath).toString())));
    await airdrop(connection, payer.publicKey, 5);

    const isMutable = false;
    const mintResult = await mintNFT(connection, payer, NFT_URL, isMutable, undefined, 0, true);
    if (!mintResult) { throw new Error("failed to create mint data") }
    const filterResult = await mintNFT(connection, payer, FILTER_URL, isMutable, undefined, 0, true);
    if (!filterResult) { throw new Error("failed to create filter data") }


    const wallet = new NodeWallet(payer);
    const provider = new Provider(connection, wallet, { commitment: "confirmed", skipPreflight: true });
    const fuserProgram = await Program.at("fuseis4soWTGiwuDUTKXQZk3xZFRjGB8cPyuDERzd98", provider);

    return {
        connection,
        payer,
        wallet,
        provider,
        fuserProgram,
        mintResult,
        filterResult
        // metadataProgram,
    }
}

test("fuser", async (t) => {
    const {
        connection,
        payer,
        fuserProgram
    } = await setupPrereqs();

    const filterSettingSeeds = [Buffer.from("filter"), NATIVE_MINT.toBuffer()];
    const [filterSettingsKey, _bump] = await PublicKey.findProgramAddress(filterSettingSeeds, fuserProgram.programId)
    const txId = await fuserProgram.rpc.createFilterSettings(
        new BN(0),
        false,
        {
            accounts: {
                payer: payer.publicKey,
                filterMint: NATIVE_MINT,
                treasury: Keypair.generate().publicKey,
                treasuryMint: NATIVE_MINT,
                filterSettings: filterSettingsKey,
                crankAuthority: Keypair.generate().publicKey,
                systemProgram: SystemProgram.programId,
            },
            signers: [payer],
        }
    );
    const txInfo = await connection.getTransaction(txId, { commitment: "confirmed" });
    t.ok(!!txInfo?.meta?.err, `${txId} succeeded`)
});