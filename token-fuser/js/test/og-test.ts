import { Provider, Program } from "@project-serum/anchor";
import {
    SYSVAR_RENT_PUBKEY,
    SystemProgram,
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    sendAndConfirmTransaction
} from '@solana/web3.js';
import { airdrop } from '@metaplex-foundation/amman';
import { TokenFuser } from '../types/token_fuser';
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';
import {
    NATIVE_MINT, ASSOCIATED_TOKEN_PROGRAM_ID,
    createSyncNativeInstruction, createApproveInstruction, createRevokeInstruction
} from '@solana/spl-token';
import { BN } from "bn.js";
import { mintNFT } from '../mpl/commands/mint-nft';
import test from 'tape';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { TOKEN_PROGRAM_ID, WRAPPED_SOL_MINT } from "../mpl/helpers/constants";
import { createAssociatedTokenAccountInstruction, } from "../mpl/helpers/instructions";
import { getTokenWallet } from "../mpl/helpers/accounts";

const NFT_URL = "https://arweave.net/lzY_4nfg9cWziM2vDd_SXTzdHDAMguNnNO1hHDRQwZM";
const FILTER_URL = "https://arweave.net/v3qUWmuUQN8S6aMAeTeoKw14rp6YNoqg6lDDGB7Gfv8";
const FUSE_URI = "https://arweave.net/ma4iMrOewMI6pzz6cXW8Ix9f7pL5Vs7X3-fjZspsWyQ";

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
    const treasuryMint = NATIVE_MINT;
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
                treasuryMint: treasuryMint,
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

    const bountyAmount = 1e6;
    const payerTokenAccount = await getTokenWallet(payer.publicKey, treasuryMint);
    const ataPayerIx = createAssociatedTokenAccountInstruction(
        payerTokenAccount,
        payer.publicKey,
        payer.publicKey,
        treasuryMint
    );
    let tx = new Transaction().add(ataPayerIx);
    let ataTxid = await sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });
    console.log("payer ata creation confirmed:", ataTxid);

    const fillPayerATA = await sendAndConfirmTransaction(
        connection,
        new Transaction().add(SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: payerTokenAccount,
            lamports: bountyAmount,
            programId: SystemProgram.programId,
        })).add(createSyncNativeInstruction(payerTokenAccount, TOKEN_PROGRAM_ID)),
        [payer],
        { commitment: "confirmed", skipPreflight: true }
    );
    console.log("Filled payer ata", fillPayerATA);

    const fuseRequestEscrow = await getTokenWallet(fuseRequest, treasuryMint);
    const ataEscrowIx = createAssociatedTokenAccountInstruction(
        fuseRequestEscrow,
        payer.publicKey,
        fuseRequest,
        treasuryMint
    );
    tx = new Transaction().add(ataEscrowIx);
    ataTxid = await sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });
    console.log("escrow ata creation confirmed:", ataTxid);

    console.log("Creating fuse request...");
    const fuseRequestIxs = [
        createApproveInstruction(
            payerTokenAccount,
            fuseRequest,
            payer.publicKey,
            bountyAmount,
        ),
        fuserProgram.instruction.requestFuse(
            fuseRequestBump,
            new BN(bountyAmount),
            {
                accounts: {
                    mint: mintResult.mint,
                    payerTokenAccount,
                    filterMint: filterResult.mint,
                    filterSettings: filterSettingsKey,
                    fuseRequest,
                    fuseRequestEscrow,
                    treasuryMint,
                    payer: payer.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    rent: SYSVAR_RENT_PUBKEY,
                },
                signers: [payer]
            }
        ),
        createRevokeInstruction(
            payerTokenAccount,
            payer.publicKey,
        )
    ];

    let requestFuseTx = new Transaction();
    fuseRequestIxs.map((ix) => {
        requestFuseTx = requestFuseTx.add(ix);
    });

    const requestFuseTxId = await sendAndConfirmTransaction(connection, requestFuseTx, [payer], { commitment: "confirmed", skipPreflight: true })
    console.log("Sent fuse request tx with id:", requestFuseTxId);

    console.log("Fulfilling fuse request...");
    await fuserProgram.rpc.fulfillFuseRequest(
        FUSE_URI,
        "filtered",
        "F-AKARI",
        {
            accounts: {
                mint: mintResult.mint,
                fuseRequest,
                claimer: crankAuthority.publicKey,
                requester: payer.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            },
            signers: [crankAuthority]
        }
    );
    console.log("Fulfilled!!!");
});