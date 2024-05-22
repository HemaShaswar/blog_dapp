use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct BlogPost {
    pub author: Pubkey,
    #[max_len(25)]
    pub title: String,
    #[max_len(850)]
    pub content: String,
    pub post_id: u64,
    pub timestamp: i64,
}

#[account]
pub struct GlobalState {
    pub total_posts: u64,
    pub post_addresses: Vec<Pubkey>,
}

impl GlobalState {
    pub const MAX_POSTS: usize = 100;
    pub const LEN: usize = 8 + (32 * Self::MAX_POSTS);
}
