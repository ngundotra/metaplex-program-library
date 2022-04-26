use {
    anchor_lang::{
        prelude::*,
    }
};

#[error_code]
pub enum FuseError {
    #[msg("Mint account invalid for fusion since tokens have already been minted")]
    MintSupplyNonZero,
    #[msg("Filter authority is not mint authority")]
    FilterAuthorityIsNotMintAuthority
}