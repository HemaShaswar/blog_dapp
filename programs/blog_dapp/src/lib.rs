use anchor_lang::prelude::*;

mod error;
mod state;
mod instructions;

use instructions::*;

declare_id!("DhHUJjVQUkgFFF1PANUZvmwx2CR2iVjNnXeEcWfeJFJ4");

#[program]
pub mod blog_dapp {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize(ctx)
    }

    pub fn create_post(ctx: Context<CreatePost>, title: String, content: String) -> Result<()> {
        instructions::create_post(ctx, title, content)
    }

    pub fn edit_post(ctx: Context<EditPost>, title: String, content: String) -> Result<()> {
        instructions::edit_post(ctx, title, content)
    }

    pub fn delete_post(ctx: Context<DeletePost>) -> Result<()> {
        instructions::delete_post(ctx)
    }

    pub fn list_posts(ctx: Context<ListPosts>) -> Result<()> {
        instructions::list_posts(ctx)
    }
}
