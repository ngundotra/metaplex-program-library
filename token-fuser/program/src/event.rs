use anchor_lang::prelude::*;

#[event]
pub struct FuseRequestEvent {
    pub filter_mint: Pubkey,
    pub base_mint: Pubkey,
    pub creator: Pubkey,
    pub bounty: u64
}

impl FuseRequestEvent {
    pub fn init(filter_mint: &Pubkey, base_mint: &Pubkey, creator: &Pubkey, bounty: u64) -> Self {
        Self {
            filter_mint: filter_mint.clone(),
            base_mint: base_mint.clone(),
            creator: creator.clone(),
            bounty
        }
    }
}