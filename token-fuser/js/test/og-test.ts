import { Provider, Program } from "@project-serum/anchor";
import {
    SYSVAR_RENT_PUBKEY,
    SYSVAR_CLOCK_PUBKEY,
    SystemProgram,
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    sendAndConfirmTransaction
} from '@solana/web3.js';
// import { airdrop } from '@metaplex-foundation/amman';
import { TokenFuser } from '../types/token_fuser';
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';
import {
    NATIVE_MINT, ASSOCIATED_TOKEN_PROGRAM_ID,
    MintLayout,
    Token,
} from '@solana/spl-token';
import BN from "bn.js";
import {
    actions
} from '@metaplex/js';
const { mintNFT }  = actions;

import test from 'tape';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { 
    TOKEN_PROGRAM_ID, 
    WRAPPED_SOL_MINT, 
    TOKEN_METADATA_PROGRAM_ID, 
    TOKEN_ENTANGLEMENT_PROGRAM_ID 
} from "../mpl/helpers/constants";
import { 
    getAtaForMint, 
    getMasterEdition, 
    getMetadata, 
    getTokenEntanglement, 
    getTokenEntanglementEscrows, 
    getTokenWallet 
} from "../mpl/helpers/accounts";

const NFT_URL = "https://arweave.net/lzY_4nfg9cWziM2vDd_SXTzdHDAMguNnNO1hHDRQwZM";
const FILTER_URL = "https://arweave.net/v3qUWmuUQN8S6aMAeTeoKw14rp6YNoqg6lDDGB7Gfv8";
const FUSE_URI = "https://arweave.net/ma4iMrOewMI6pzz6cXW8Ix9f7pL5Vs7X3-fjZspsWyQ";

type NFTResult = {
    mint: PublicKey,
    metadata: PublicKey,
    edition: PublicKey,
};
type TestNFT = {
    mintResult: NFTResult,
    filterResult: NFTResult
};
async function loadTestNFTs(connection: Connection, payer: Keypair): Promise<TestNFT> {
    const fname = ".test-nfts.json";

    const wallet = new NodeWallet(payer);
    // if (!existsSync(fname)) {
    console.log("making first mint");
    const mintResult = await mintNFT({connection, wallet, uri: NFT_URL, maxSupply: 0 });
    if (!mintResult) { throw new Error("failed to create mint data") }
    console.log("making second mint");
    const filterResult = await mintNFT({connection, wallet, uri: FILTER_URL, maxSupply: 0});
    if (!filterResult) { throw new Error("failed to create filter data") }

    //     const toSave = JSON.stringify({ mintResult, filterResult });
    //     writeFileSync(fname, toSave);
    // }

    // const testResults = JSON.parse(readFileSync(fname).toString());
    return {
        mintResult,
        filterResult,
    }
}

const setupPrereqs = async () => {
    const connection = new Connection("http://localhost:8899", { commitment: "confirmed" });
    const keypairPath = `${process.env.HOME}/.config/solana/id.json`;
    const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(keypairPath).toString())));
    const sig = await connection.requestAirdrop(payer.publicKey, 5*1e9);
    await connection.confirmTransaction(sig);

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
    const treasury = Keypair.generate();
    const treasuryMint = NATIVE_MINT;
    // const treasuryMint = new PublicKey("So11111111111111111111111111111111111111112");
    // console.log(NATIVE_MINT.toString(), "\n\n\n\n");
    const crankAuthority = Keypair.generate();
    const listener = fuserProgram.addEventListener("FuseRequestEvent", (event, slot) => {
        console.log("Found data!!!", event, slot);
    });
    const txId = await fuserProgram.rpc.createFilterSettings(
        _bump,
        new BN(0),
        false,
        {
            accounts: {
                payer: payer.publicKey,
                filterMint: filterResult.mint,
                treasury: treasury.publicKey,
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
    // const payerTokenAccount = await getTokenWallet(payer.publicKey, treasuryMint);
    // const ataPayerIx = Token.createAssociatedTokenAccountInstruction(
    //     ASSOCIATED_TOKEN_PROGRAM_ID,
    //     TOKEN_PROGRAM_ID,
    //     treasuryMint,
    //     payerTokenAccount,
    //     payer.publicKey,
    //     payer.publicKey,
    // );
    // let tx = new Transaction().add(ataPayerIx);
    // let ataTxid = await sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });
    // console.log("payer ata creation confirmed:", ataTxid);

    // const fillPayerATA = await sendAndConfirmTransaction(
    //     connection,
    //     new Transaction().add(SystemProgram.transfer({
    //         fromPubkey: payer.publicKey,
    //         toPubkey: payerTokenAccount,
    //         lamports: bountyAmount,
    //         programId: SystemProgram.programId,
    //     })),
        // .add(
        //     createSyncNativeInstruction(payerTokenAccount, TOKEN_PROGRAM_ID)
        // ),
    //     [payer],
    //     { commitment: "confirmed", skipPreflight: true }
    // );
    // console.log("Filled payer ata", fillPayerATA);

    const payerTokenAccount = await Token.createWrappedNativeAccount(
        connection,
        TOKEN_PROGRAM_ID,
        payer.publicKey,
        payer,
        bountyAmount
    )
    // Token.createWrappedNativeAccount()

    const fuseRequestEscrow = await getTokenWallet(fuseRequest, treasuryMint);
    const ataEscrowIx = Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        treasuryMint,
        fuseRequestEscrow,
        fuseRequest,
        payer.publicKey,
    );
    let tx = new Transaction().add(ataEscrowIx);
    let ataTxid = await sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });
    console.log("escrow ata creation confirmed:", ataTxid);

    console.log("Creating fuse request...");
    const fuseRequestIxs = [
        Token.createApproveInstruction(
            TOKEN_PROGRAM_ID,
            payerTokenAccount,
            fuseRequest,
            payer.publicKey,
            [],
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
        Token.createRevokeInstruction(
            TOKEN_PROGRAM_ID,
            payerTokenAccount,
            payer.publicKey,
            []
        )
    ];

    let requestFuseTx = new Transaction();
    fuseRequestIxs.map((ix) => {
        requestFuseTx = requestFuseTx.add(ix);
    });

    const requestFuseTxId = await sendAndConfirmTransaction(connection, requestFuseTx, [payer], { commitment: "confirmed", skipPreflight: true })
    console.log("Sent fuse request tx with id:", requestFuseTxId);

    console.log("Creating treasury token account")
    const treasuryTokenAccount = await Token.createWrappedNativeAccount(
        connection,
        TOKEN_PROGRAM_ID,
        treasury.publicKey,
        payer,
        0
    );
    // const treasuryTokenAccount = await getTokenWallet(treasury.publicKey, treasuryMint);
    // const ataTreasuryIx = Token.createAssociatedTokenAccountInstruction(
    //     ASSOCIATED_TOKEN_PROGRAM_ID,
    //     TOKEN_PROGRAM_ID,
    //     treasuryMint,
    //     treasuryTokenAccount,
    //     payer.publicKey,
    //     treasury.publicKey,
    // );
    // tx = new Transaction().add(ataTreasuryIx);
    // ataTxid = await sendAndConfirmTransaction(
    //     connection,
    //     tx,
    //     [payer],
    //     { commitment: "confirmed", skipPreflight: true }
    // );
    // console.log("Successfully created treasury token account address:", ataTxid);

    console.log("Fulfilling fuse request...");
    await fuserProgram.rpc.fulfillFuseRequest(
        FUSE_URI,
        "filtered",
        "F-AKARI",
        {
            accounts: {
                mint: mintResult.mint,
                fuseRequest,
                fuseRequestEscrow,
                treasuryTokenAccount,
                filterSettings: filterSettingsKey,
                claimer: crankAuthority.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            },
            signers: [crankAuthority]
        }
    );

    console.log("Fulfilled request!...\n");

    const mintRent = await connection.getMinimumBalanceForRentExemption(
        MintLayout.span,
    );

    const resultMintKeypair = Keypair.generate();
    const resultMint = resultMintKeypair.publicKey;
    const resultMetadataAccount = await getMetadata(resultMint);
    const resultMasterEdition = await getMasterEdition(resultMint);
    const resultAta = await getTokenWallet(payer.publicKey, resultMint);

    const resultTxid = await sendAndConfirmTransaction(
        connection,
        new Transaction()
            .add(SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: resultMint,
                lamports: mintRent,
                space: MintLayout.span,
                programId: TOKEN_PROGRAM_ID,
            }))
            .add(Token.createInitMintInstruction(
                TOKEN_PROGRAM_ID,
                resultMint,
                0,
                payer.publicKey,
                null
            ))
            .add(Token.createAssociatedTokenAccountInstruction(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                resultMint,
                resultAta,
                payer.publicKey,
                payer.publicKey,
            ))
            .add(Token.createMintToInstruction(
                TOKEN_PROGRAM_ID,
                resultMint,
                resultAta,
                payer.publicKey,
                [],
                1,
            ))
            .add(fuserProgram.instruction.createFusedMetadata(
                {
                    accounts: {
                        filterMint: filterResult.mint,
                        fuseRequest,
                        filterSettings: filterSettingsKey,
                        fuseCreator: crankAuthority.publicKey,
                        payer: payer.publicKey,
                        baseMetadata: mintResult.metadata,

                        metadata: resultMetadataAccount,
                        mint: resultMint,
                        mintAuthority: payer.publicKey,
                        updateAuthority: payer.publicKey,
                        masterEdition: resultMasterEdition,
                        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                        rent: SYSVAR_RENT_PUBKEY,
                        clock: SYSVAR_CLOCK_PUBKEY,
                    },
                    signers: [payer]
                }
            )),
        [payer, resultMintKeypair],
        { commitment: "confirmed", skipPreflight: true }
    );
    console.log(`Minted new filtered NFT!!! ${resultTxid} \n`);

    const [entangledPair, epBump] = await getTokenEntanglement(mintResult.mint, resultMint);
    const [reverseEntangledPair, reverseEpBump] = await getTokenEntanglement(resultMint, mintResult.mint);

    const [tokenAEscrow, _aBump, tokenBEscrow, _bBump] =
        await getTokenEntanglementEscrows(mintResult.mint, resultMint);

    const transferAuthorityKeypair = Keypair.generate();

    const tokenASeeds = [
        Buffer.from("token_entangler"),
        mintResult.mint.toBuffer(),
        resultMint.toBuffer(),
        Buffer.from("escrow"),
        Buffer.from("A")
    ]
    const [expected, _] = await PublicKey.findProgramAddress(tokenASeeds, TOKEN_ENTANGLEMENT_PROGRAM_ID)
    const badSeeds = [
        Buffer.from("token_entangler"),
        resultMint.toBuffer(),
        mintResult.mint.toBuffer(),
        Buffer.from("escrow"),
        Buffer.from("A")
    ]
    const [bad, __] = await PublicKey.findProgramAddress(badSeeds, TOKEN_ENTANGLEMENT_PROGRAM_ID)
    console.log("\n");
    console.log(`${tokenAEscrow.toString()} vs expected ${expected.toString()}`);
    console.log(`${tokenBEscrow.toString()} vs expected ${expected.toString()}`);
    console.log(`${tokenAEscrow.toString()} vs bad ${bad.toString()}`);
    console.log(`${tokenBEscrow.toString()} vs bad ${bad.toString()}`);
    console.log("\n");

    let entangleTxid = "";
    try {
        const entangleTx = new Transaction()
            .add(Token.createApproveInstruction(
                TOKEN_PROGRAM_ID,
                resultAta,
                transferAuthorityKeypair.publicKey,
                payer.publicKey,
                [],
                1
            ))
            .add(fuserProgram.instruction.entangleBaseAndFused(
                epBump,
                reverseEpBump,
                _aBump,
                _bBump,
                {
                    accounts: {
                        filterSettings: filterSettingsKey,
                        filterMint: filterResult.mint,
                        fuseRequest,
                        payer: payer.publicKey,
                        treasuryMint: treasuryMint,
                        transferAuthority: transferAuthorityKeypair.publicKey,
                        authority: fuseRequest,
                        mintOriginal: mintResult.mint,
                        metadataOriginal: mintResult.metadata,
                        editionOriginal: await getMasterEdition(mintResult.mint),
                        mintFiltered: resultMint,
                        metadataFiltered: resultMetadataAccount,
                        editionFiltered: resultMasterEdition,
                        tokenB: resultAta,
                        tokenAEscrow,
                        tokenBEscrow,
                        entangledPair,
                        reverseEntangledPair,
                        entanglerProgram: TOKEN_ENTANGLEMENT_PROGRAM_ID,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                        rent: SYSVAR_RENT_PUBKEY
                    },
                    signers: [payer, transferAuthorityKeypair]
                }
            ))
            .add(Token.createRevokeInstruction(
                TOKEN_PROGRAM_ID,
                resultAta,
                payer.publicKey,
                [],
            ));

        console.log("Sending entangle tx...\n")
        entangleTxid = await sendAndConfirmTransaction(
            connection,
            entangleTx,
            [payer, transferAuthorityKeypair],
            { commitment: "confirmed", skipPreflight: true }
        );
    } catch {
        console.log("Trying the reverse direction")

        const ata = await getTokenWallet(payer.publicKey, mintResult.mint);
        const entangleTx = new Transaction()
            .add(Token.createApproveInstruction(
                TOKEN_PROGRAM_ID,
                ata,
                transferAuthorityKeypair.publicKey,
                payer.publicKey,
                [],
                1
            ))
            .add(fuserProgram.instruction.entangleBaseAndFused(
                reverseEpBump,
                epBump,
                _bBump,
                _aBump,
                {
                    accounts: {
                        filterSettings: filterSettingsKey,
                        fuseRequest,
                        payer: payer.publicKey,
                        treasuryMint: treasuryMint,
                        transferAuthority: transferAuthorityKeypair.publicKey,
                        authority: fuseRequest,
                        mintOriginal: resultMint,
                        metadataOriginal: resultMetadataAccount,
                        editionOriginal: resultMasterEdition,
                        mintFiltered: mintResult.mint,
                        metadataFiltered: mintResult.metadata,
                        editionFiltered: mintResult.edition,
                        tokenB: ata,
                        tokenAEscrow: tokenBEscrow,
                        tokenBEscrow: tokenAEscrow,
                        entangledPair: reverseEntangledPair,
                        reverseEntangledPair: entangledPair,
                        entanglerProgram: TOKEN_ENTANGLEMENT_PROGRAM_ID,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                        rent: SYSVAR_RENT_PUBKEY
                    },
                    signers: [payer, transferAuthorityKeypair]
                }
            ))
            .add(Token.createRevokeInstruction(
                TOKEN_PROGRAM_ID,
                ata,
                payer.publicKey,
                [],
            ));

        console.log("Sending reverse entangle tx...\n")
        entangleTxid = await sendAndConfirmTransaction(
            connection,
            entangleTx,
            [payer, transferAuthorityKeypair],
            { commitment: "confirmed", skipPreflight: true }
        );
    }

    console.log(`Successfully entangled pair: ${entangledPair.toString()}`);
    console.log(`or reverse entangled pair: ${reverseEntangledPair.toString()}\n`);
    console.log(`Tx id: ${entangleTxid}\n`);

    await fuserProgram.removeEventListener(listener);
});
