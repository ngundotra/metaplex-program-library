import { Provider, Program } from "@project-serum/anchor";
import { SystemProgram, Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { airdrop } from '@metaplex-foundation/amman';
import { TokenFuser } from '../types/token_fuser';
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';
import { NATIVE_MINT } from '@solana/spl-token';
import { BN } from "bn.js";
import { mintNFT } from '../mpl/commands/mint-nft';
import test from 'tape';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { TOKEN_PROGRAM_ID } from "../mpl/helpers/constants";

const NFT_URL = "https://arweave.net/lzY_4nfg9cWziM2vDd_SXTzdHDAMguNnNO1hHDRQwZM";
const FILTER_URL = "https://arweave.net/v3qUWmuUQN8S6aMAeTeoKw14rp6YNoqg6lDDGB7Gfv8";

type NFTResult = {
    mint: PublicKey,
    metadataAccount: PublicKey,
};
type TestNFT = {
    mintResult: NFTResult,
    filterResult: NFTResult
};
async function loadTestNFTs(connection: Connection, payer: Keypair): Promise<TestNFT> {
    const fname = ".test-nfts.json";

    if (!existsSync(fname)) {
        const isMutable = false;
        const mintResult = await mintNFT(connection, payer, NFT_URL, isMutable, undefined, 0, true);
        if (!mintResult) { throw new Error("failed to create mint data") }
        const filterResult = await mintNFT(connection, payer, FILTER_URL, isMutable, undefined, 0, true);
        if (!filterResult) { throw new Error("failed to create filter data") }

        const toSave = JSON.stringify({ mintResult, filterResult });
        writeFileSync(fname, toSave);
    }

    const testResults = JSON.parse(readFileSync(fname).toString());
    const parsedResults = {
        mintResult: {
            mint: new PublicKey(testResults.mintResult.mint),
            metadataAccount: new PublicKey(testResults.mintResult.metadataAccount),
        },
        filterResult: {
            mint: new PublicKey(testResults.filterResult.mint),
            metadataAccount: new PublicKey(testResults.filterResult.metadataAccount),
        }
    }
    return parsedResults;
}

const setupPrereqs = async () => {
    const connection = new Connection("http://localhost:8899", { commitment: "confirmed" });
    const keypairPath = `${process.env.HOME}/.config/solana/id.json`;
    const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(keypairPath).toString())));
    await airdrop(connection, payer.publicKey, 5);

    const { mintResult, filterResult } = await loadTestNFTs(connection, payer);
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
    }
}

test("fuser", async (t) => {
    const {
        connection,
        payer,
        mintResult,
        filterResult,
        fuserProgram
    } = await setupPrereqs();

    const filterSettingSeeds = [Buffer.from("filter"), filterResult.mint.toBuffer()];
    const [filterSettingsKey, _bump] = await PublicKey.findProgramAddress(filterSettingSeeds, fuserProgram.programId)
    const crankAuthority = Keypair.generate();
    const txId = await fuserProgram.rpc.createFilterSettings(
        _bump,
        new BN(0),
        false,
        {
            accounts: {
                payer: payer.publicKey,
                filterMint: filterResult.mint,
                treasury: Keypair.generate().publicKey,
                treasuryMint: NATIVE_MINT,
                filterSettings: filterSettingsKey,
                crankAuthority: crankAuthority.publicKey,
                systemProgram: SystemProgram.programId,
            },
            signers: [payer],
        }
    );
    const txInfo = await connection.getTransaction(txId, { commitment: "confirmed" });
    t.ok(!txInfo?.meta?.err, `${txId} succeeded`)

    const fuseRequestSeeds = [
        Buffer.from("fuse_request"),
        mintResult.mint.toBuffer(),
        filterResult.mint.toBuffer(),
    ];
    const [fuseRequest, fuseRequestBump] = await PublicKey.findProgramAddress(fuseRequestSeeds, fuserProgram.programId);

    await fuserProgram.rpc.requestFuse(
        fuseRequestBump,
        new BN(0),
        {
            accounts: {
                mint: mintResult.mint,
                claimer: crankAuthority.publicKey,
                filterMint: filterResult.mint,
                filterSettings: filterSettingsKey,
                fuseRequest,
                payer: payer.publicKey,
                requester: payer.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            },
            signers: [payer]
        }
    );
});