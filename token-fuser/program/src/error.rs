use {
    anchor_lang::{
        prelude::*,
    }
};

#[error_code]
pub enum FuseError {
    #[msg("Mint account invalid for fusion, need exactly 1 token minted")]
    MintSupplyIncorrect,
    #[msg("Filter authority is not mint authority")]
    FilterAuthorityIsNotMintAuthority
}