pub mod error;

use {
    anchor_lang::{
        prelude::*,
        solana_program::{
            program::{invoke, invoke_signed},
            program_option::COption,
            system_instruction
        },
        //solana_program::entrypoint::ProgramResult,
        AnchorDeserialize, AnchorSerialize,
    },
    spl_token::instruction::AuthorityType,
    anchor_spl::{
        associated_token::AssociatedToken,
        token::{
            // self, Transfer, 
            Token, TokenAccount, Mint
        },
    },
    mpl_token_metadata::{
        instruction::{
            // approve_collection_authority, 
            create_master_edition_v3, create_metadata_accounts_v2,
            // revoke_collection_authority
        },
        state::{
            Metadata, 
            Creator
            // MAX_CREATOR_LEN, MAX_CREATOR_LIMIT, MAX_NAME_LENGTH, MAX_SYMBOL_LENGTH,
            // MAX_URI_LENGTH,
        },
        // utils::{assert_derivation, create_or_allocate_account_raw},
    },
    crate::error::FuseError
};


anchor_lang::declare_id!("fuseis4soWTGiwuDUTKXQZk3xZFRjGB8cPyuDERzd98");

const FILTER_PREFIX: &str = "filter";
const FILTER_SETTINGS_SIZE: usize =
8     // discriminant
+ 1   // bump
+ 32  // filter mint
+ 32  // treasury mint
+ 32  // treasury address
+ 8   // price
+ 1   // pays every time
+ 32; // crank authority

use anchor_spl::token::SetAuthority;

const FUSE_INFO_PREFIX: &str = "fuse_request"; 
const FUSE_INFO_SIZE: usize = 
1 + // bump
32 + // mint key
32 + // filter key
32 + // requester
1 + // is complete
8 + // bounty amount
4 + // uri length
200 + // uri
4 +  // name length
200 + // name
4 + // symbol length
200 ; // symbol


pub fn make_ata<'a>(
    ata: AccountInfo<'a>,
    wallet: AccountInfo<'a>,
    mint: AccountInfo<'a>,
    fee_payer: AccountInfo<'a>,
    ata_program: AccountInfo<'a>,
    token_program: AccountInfo<'a>,
    system_program: AccountInfo<'a>,
    rent: AccountInfo<'a>,
    fee_payer_seeds: &[&[u8]],
) -> Result<()> {
    let seeds: &[&[&[u8]]];
    let as_arr = [fee_payer_seeds];

    if fee_payer_seeds.len() > 0 {
        seeds = &as_arr;
    } else {
        seeds = &[];
    }

    invoke_signed(
        &spl_associated_token_account::create_associated_token_account(
            &fee_payer.key,
            &wallet.key,
            &mint.key,
        ),
        &[
            ata,
            wallet,
            mint,
            fee_payer,
            ata_program,
            system_program,
            rent,
            token_program,
        ],
        seeds,
    )?;

    Ok(())
}
#[program]
pub mod token_fuser {

    use super::*;

    pub fn create_filter_settings(
        ctx: Context<CreateFilterSettings>,
        bump: u8,
        price: u64,
        pays_every_time: bool,
    ) -> Result<()> {
        let filter_settings = &mut ctx.accounts.filter_settings;

        // TODO(ngundotra): Check that filter_mint is a valid NFT
        // TODO(ngundotra): Check that the creator of this account is the upgrade auth on metadata
        filter_settings.filter_mint = ctx.accounts.filter_mint.key();
        filter_settings.crank_authority = ctx.accounts.crank_authority.key();
        filter_settings.treasury_mint = ctx.accounts.treasury_mint.key();
        filter_settings.treasury_address = ctx.accounts.treasury.key();

        filter_settings.pays_every_time = pays_every_time;
        filter_settings.price = price;
        filter_settings.bump = bump;

        Ok(())
    }

    pub fn request_fuse(
        ctx: Context<RequestFuse>,
        bump: u8,
        bounty_amount: u64,
    ) -> Result<()> {
        // TODO(ngundotra): check that the user actually has one of these NFTs
        // TODO(ngundotra): check that the filter actually has entangler_settings set
        ctx.accounts.fuse_request.mint = ctx.accounts.mint.key();
        ctx.accounts.fuse_request.requester = ctx.accounts.payer.key();
        ctx.accounts.fuse_request.completed = false;
        ctx.accounts.fuse_request.filter = ctx.accounts.filter_mint.key();
        ctx.accounts.fuse_request.bump = bump;
        ctx.accounts.fuse_request.bounty_amount = bounty_amount;

        // Create bounty
        let signer_seeds = [
            FUSE_INFO_PREFIX.as_bytes(),
            ctx.accounts.fuse_request.mint.as_ref(),
            ctx.accounts.filter_settings.filter_mint.as_ref(),
            &[bump]
        ]; 

        msg!("Transferring tokens...");
        msg!("Source: {:?}", ctx.accounts.payer_token_account.key().to_string());
        msg!("... owner {:?}", ctx.accounts.payer_token_account.owner.to_string());
        let mut delegate_str = match ctx.accounts.payer_token_account.delegate {
            COption::Some(delegate) => delegate.to_string(),
            COption::None => "~none~".to_string()
        };
        msg!("... delegate {:?}", delegate_str);

        msg!("Destination: {:?}", ctx.accounts.fuse_request_escrow.key().to_string());
        msg!("... owner {:?}", ctx.accounts.fuse_request_escrow.owner.to_string());
        delegate_str = match ctx.accounts.fuse_request_escrow.delegate {
            COption::Some(delegate) => delegate.to_string(),
            COption::None => "~none~".to_string()
        };
        msg!("... delegate {:?}", delegate_str);
        invoke_signed(
            &spl_token::instruction::transfer(
                ctx.accounts.token_program.key,
                &ctx.accounts.payer_token_account.key(),
                &ctx.accounts.fuse_request_escrow.key(),
                &ctx.accounts.fuse_request.key(),
                &[],
                bounty_amount,
            )?,
            &[
                ctx.accounts.payer_token_account.to_account_info(),
                ctx.accounts.fuse_request_escrow.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.fuse_request.to_account_info(),
            ],
            &[&signer_seeds]
        )?;
        msg!("Setup a bounty for the NFT");

        Ok(())
    }

    pub fn fulfill_fuse_request(
        ctx: Context<FulfillFuseRequest>,
        uri: String,
        name: String,
        symbol: String,
    ) -> Result<()> {
        // Upload URI
        ctx.accounts.fuse_request.uri = uri;
        ctx.accounts.fuse_request.name = name;
        ctx.accounts.fuse_request.symbol = symbol;

        // Claim bounty
        let signer_seeds = [
            FUSE_INFO_PREFIX.as_bytes(),
            &ctx.accounts.mint.to_account_info().key.as_ref(),
            &ctx.accounts.fuse_request.filter.as_ref(),
            &[ctx.accounts.fuse_request.bump]
        ];
        invoke_signed(
            &spl_token::instruction::transfer(
                &ctx.accounts.token_program.key(),
                &ctx.accounts.fuse_request_escrow.key(),
                &ctx.accounts.treasury_token_account.key(),
                &ctx.accounts.fuse_request.key(),
                &[],
                ctx.accounts.fuse_request.bounty_amount
            )?,
            &[
                ctx.accounts.fuse_request_escrow.to_account_info().clone(),
                ctx.accounts.treasury_token_account.to_account_info().clone(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.fuse_request.to_account_info(),
            ],
            &[&signer_seeds]
        )?;
        ctx.accounts.fuse_request.completed = true;

        Ok(())
    }

    pub fn create_fused_metadata(
        ctx: Context<MintNFT>
    ) -> Result<()> {
        // Give the fuse_request pda account control over how many have been minted
        require!(ctx.accounts.mint.supply == 1, FuseError::MintSupplyIncorrect);
        msg!("Setting fuse request as authority");
        invoke(
            &spl_token::instruction::set_authority(
                &ctx.accounts.token_program.key,
                &ctx.accounts.mint.key(),
                // None,
                Some(&ctx.accounts.fuse_request.key()),
                AuthorityType::MintTokens, 
                &ctx.accounts.payer.key,
                &[],
            )?,
            &[
                ctx.accounts.mint.to_account_info(),
                ctx.accounts.payer.to_account_info(),
            ],
        )?;
        
        let fuse_creator = &ctx.accounts.fuse_creator;
        let base_metadata = Metadata::from_account_info(&ctx.accounts.base_metadata)?;
        let is_mutable = true;
        // This is interesting. This is basically saying the only way for tokens to be minted
        // is by interacting with this program
        let fuse_authority = &ctx.accounts.fuse_request;

        let fuse_authority_seeds = [
            FUSE_INFO_PREFIX.as_bytes(),
            ctx.accounts.fuse_request.mint.as_ref(),
            ctx.accounts.filter_settings.filter_mint.as_ref(),
            &[ctx.accounts.fuse_request.bump]
        ];
        
        let metadata_infos = vec![
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            fuse_authority.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
            fuse_creator.to_account_info()
        ];

        let master_edition_infos = vec![
            ctx.accounts.master_edition.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            fuse_authority.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
            fuse_creator.to_account_info(),
        ];

        let creator = Creator {
            address: ctx.accounts.fuse_request.key(),
            verified: true,
            share: 100
        };
        let creators = vec![creator];
        msg!("Creating metadata!");
        invoke_signed(
            &create_metadata_accounts_v2(
                ctx.accounts.token_metadata_program.key(),
                ctx.accounts.metadata.key(),
                ctx.accounts.mint.key(),
                fuse_authority.key(),
                ctx.accounts.payer.key(),
                fuse_authority.key(),
                ctx.accounts.fuse_request.name.clone(),
                ctx.accounts.fuse_request.symbol.clone(),
                ctx.accounts.fuse_request.uri.clone(),
                // base_metadata.data.creators,
                Some(creators),
                base_metadata.data.seller_fee_basis_points,
                true,
                is_mutable,
                None,
                None,
            ),
            metadata_infos.as_slice(),
            &[&fuse_authority_seeds],
        )?;

        msg!("Creating master edition!");
        invoke_signed(
            &create_master_edition_v3(
                ctx.accounts.token_metadata_program.key(),
                ctx.accounts.master_edition.key(),
                ctx.accounts.mint.key(),
                fuse_authority.key(),
                fuse_authority.key(),
                ctx.accounts.metadata.key(),
                ctx.accounts.payer.key(),
                // TODO(ngundotra): actually set up format that allows
                // modification of this max_supply
                Some(1),
            ),
            master_edition_infos.as_slice(),
            &[&fuse_authority_seeds]
        )?;

        Ok(())
    }

    // inits the entangler... may require settings lol
    pub fn entangle_base_and_fused(
        ctx: Context<EntangleComponents>
    ) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct RequestFuse<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    #[account(mut, constraint = payer_token_account.mint == filter_settings.treasury_mint)]
    payer_token_account: Box<Account<'info, TokenAccount>>,
    /// This is the mint account we wish to use
    /// for initiating the filter
    mint: Box<Account<'info, Mint>>,
    // Also an NFT... ideally you'd own one of both
    filter_mint: Box<Account<'info, Mint>>,
    #[account(
        seeds=[&FILTER_PREFIX.as_bytes(), filter_mint.key().as_ref()],
        bump=filter_settings.bump
    )]
    filter_settings: Box<Account<'info, FilterSettings>>,
    #[account(address = filter_settings.treasury_mint)]
    treasury_mint: Box<Account<'info, Mint>>,
    /// You have to have one of these to request
    /// Set desired crank authority
    #[account(
        init, 
        seeds=[
            FUSE_INFO_PREFIX.as_bytes(), 
            mint.key().as_ref(), 
            filter_mint.key().as_ref(),
        ],
        space=FUSE_INFO_SIZE,
        bump,
        payer=payer,
    )]
    fuse_request: Box<Account<'info, FuseRequest>>,
    #[account(mut)]
    fuse_request_escrow: Account<'info, TokenAccount>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    ata_program: Program<'info, AssociatedToken>,
    rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct FulfillFuseRequest<'info> {
    /// Really just to confirm that the metadata account
    /// uri matches what the NFT was generated for
    mint: Box<Account<'info, Mint>>,
    ///TODO(ngundotra): add the metadata account
    #[account(
        mut,
        seeds=[FUSE_INFO_PREFIX.as_bytes(), mint.key().as_ref(), fuse_request.filter.key().as_ref()],
        bump=fuse_request.bump
    )]
    fuse_request: Box<Account<'info, FuseRequest>>,
    #[account(
        mut,
        constraint = fuse_request_escrow.owner == fuse_request.key()
    )]
    fuse_request_escrow: Box<Account<'info, TokenAccount>>,
    filter_settings: Box<Account<'info, FilterSettings>>,
    /// Requires that this is actually the entity cranking the
    /// filter upload 
    #[account(mut)]
    claimer: Signer<'info>,
    #[account(mut)] 
    treasury_token_account: Box<Account<'info, TokenAccount>>,
    // /// CHECK: Just sending them the lamports back for closing Quark
    // #[account(mut)]
    // requester: UncheckedAccount<'info>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct MintNFT<'info> {
    filter_mint: Account<'info, Mint>,
    #[account(
        seeds=[
            FUSE_INFO_PREFIX.as_bytes(),
            fuse_request.mint.key().as_ref(),
            filter_mint.key().as_ref(),
        ],
        bump=fuse_request.bump
    )]
    fuse_request: Account<'info, FuseRequest>,
    #[account(
        seeds=[&FILTER_PREFIX.as_bytes(), filter_mint.key().as_ref()],
        bump=filter_settings.bump
    )]
    filter_settings: Account<'info, FilterSettings>,
    /// CHECK: not sure, should just be an account info to replicate along
    #[account(address = filter_settings.crank_authority)]
    fuse_creator: UncheckedAccount<'info>,
    payer: Signer<'info>,
    /// CHECK: TODO(ngundotra) verify that this mint is correct
    base_metadata: UncheckedAccount<'info>,

    // With the following accounts we aren't using anchor macros because they are CPI'd
    // through to token-metadata which will do all the validations we need on them.
    /// CHECK: account checked in CPI
    #[account(mut)]
    metadata: UncheckedAccount<'info>,
    /// CHECK: account checked in CPI
    #[account(mut)]
    mint: Account<'info, Mint>,
    mint_authority: Signer<'info>,
    update_authority: Signer<'info>,
    /// CHECK: account checked in CPI
    #[account(mut)]
    master_edition: UncheckedAccount<'info>,
    /// CHECK: account checked in CPI
    #[account(address = mpl_token_metadata::id())]
    token_metadata_program: UncheckedAccount<'info>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
    clock: Sysvar<'info, Clock>,
}

/// Used to initialize the entangled pair
/// and donate one I think.. not entirely sure.. lol.
#[derive(Accounts)]
pub struct EntangleComponents<'info> {
    filter_mint: Account<'info, Mint>,
    #[account(
        seeds=[
            &FUSE_INFO_PREFIX.as_bytes(),
            mint_original.key().as_ref(),
            filter_mint.key().as_ref(),
        ],
        bump=fuse_request.bump
    )]
    fuse_request: Account<'info, FuseRequest>,
    #[account(
        seeds=[&FILTER_PREFIX.as_bytes(), filter_mint.key().as_ref()],
        bump=filter_settings.bump
    )]
    filter_settings: Account<'info, FilterSettings>,
    #[account(mut)]
    payer: Signer<'info>,
    /// --- all of this used just to create the EP
    /// CHECK: Verified through CPI
    treasury_mint: UncheckedAccount<'info>,
    transfer_authority: Signer<'info>,
    /// CHECK: Verified through CPI
    authority: UncheckedAccount<'info>,
    mint_original: Box<Account<'info, Mint>>,
    /// CHECK: Verified through CPI
    metadata_original: UncheckedAccount<'info>,
    /// CHECK: Verified through CPI
    edition_original: UncheckedAccount<'info>,
    mint_filtered: Box<Account<'info, Mint>>,
    /// CHECK: Verified through CPI
    metadata_filtered: UncheckedAccount<'info>,
    /// CHECK: Verified through CPI
    edition_filtered: UncheckedAccount<'info>,
    #[account(mut)]
    token_b: Box<Account<'info, TokenAccount>>,
    /// CHECK: Verified through CPI
    token_a_escrow: UncheckedAccount<'info>,
    /// CHECK: Verified through CPI
    token_b_escrow: UncheckedAccount<'info>,
    /// CHECK: Verified through CPI
    entangled_pair: UncheckedAccount<'info>,
    /// CHECK: checked via CPI
    reverse_entangled_pair: UncheckedAccount<'info>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateFilterSettings<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    #[account(
        init,
        space=FILTER_SETTINGS_SIZE,
        seeds=[FILTER_PREFIX.as_bytes(), filter_mint.key().as_ref()],
        bump,
        payer=payer
    )]
    filter_settings: Account<'info, FilterSettings>,
    treasury_mint: Account<'info, Mint>,
    /// CHECK: we just want to send SOL here
    treasury: UncheckedAccount<'info>,
    /// CHECK: this is address used to upload filter results
    crank_authority: UncheckedAccount<'info>,
    filter_mint: Account<'info, Mint>,
    system_program: Program<'info, System>
}

#[account]
pub struct FuseRequest {
    pub bump: u8,
    pub mint: Pubkey,
    pub filter: Pubkey,
    pub requester: Pubkey,
    /// Has URI been set yet
    pub completed: bool,
    /// How much do they get paid for doing so
    pub bounty_amount: u64,
    /// Info for the fused NFT
    pub uri: String,
    pub name: String,
    pub symbol: String,
}

#[account]
pub struct FilterSettings {
    pub bump: u8,
    pub filter_mint: Pubkey,
    pub treasury_mint: Pubkey,
    pub treasury_address: Pubkey,
    pub price: u64,
    pub pays_every_time: bool,
    pub crank_authority: Pubkey,
}

// impl<'info> RequestFuse<'info> {
    // fn into_set_authority_context(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
    //     let cpi_accounts = SetAuthority {
    //         account_or_mint: self.token_account.to_account_info().clone(),
    //         current_authority: self.payer.to_account_info().clone(),
    //     };
    //     let cpi_program = self.token_program.to_account_info();
    //     CpiContext::new(cpi_program, cpi_accounts)
    // }
// }