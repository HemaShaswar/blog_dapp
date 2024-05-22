use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::BlogError;

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;
    global_state.total_posts = 0;
    global_state.post_addresses = Vec::new();
    Ok(())
}

pub fn create_post(ctx: Context<CreatePost>, title: String, content: String) -> Result<()> {
    require!(title.len() > 0, BlogError::InvalidTitle);
    require!(content.len() > 0, BlogError::InvalidContent);

    let blog_post = &mut ctx.accounts.blog_post;
    let global_state = &mut ctx.accounts.global_state;

    require!(global_state.total_posts < GlobalState::MAX_POSTS as u64, BlogError::PostLimitReached);

    blog_post.author = *ctx.accounts.user.key;
    blog_post.title = title;
    blog_post.content = content;
    blog_post.timestamp = Clock::get()?.unix_timestamp;

    global_state.post_addresses.push(blog_post.key());
    global_state.total_posts += 1;

    Ok(())
}

pub fn edit_post(ctx: Context<EditPost>, title: String, content: String) -> Result<()> {
    require!(title.len() > 0, BlogError::InvalidTitle);
    require!(content.len() > 0, BlogError::InvalidContent);

    let blog_post = &mut ctx.accounts.blog_post;
    blog_post.title = title;
    blog_post.content = content;
    blog_post.timestamp = Clock::get()?.unix_timestamp;
    Ok(())
}

pub fn delete_post(ctx: Context<DeletePost>) -> Result<()> {
    let blog_post = &ctx.accounts.blog_post;
    let global_state = &mut ctx.accounts.global_state;

    require!(blog_post.author == *ctx.accounts.author.key, BlogError::Unauthorized);

    // Find and remove the post's address from the list
    if let Some(pos) = global_state.post_addresses.iter().position(|&x| x == blog_post.key()) {
        global_state.post_addresses.remove(pos);
        global_state.total_posts -= 1;
    } else {
        return Err(BlogError::PostNotFound.into());
    }

    Ok(())
}

pub fn list_posts(ctx: Context<ListPosts>) -> Result<()> {
    let global_state = &ctx.accounts.global_state;
    msg!("Total Posts: {}", global_state.total_posts);
    for post_address in &global_state.post_addresses {
        msg!("Post Address: {}", post_address);
    }
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = GlobalState::LEN)]
    pub global_state: Account<'info, GlobalState>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreatePost<'info> {
    #[account(
        init, seeds = [title.as_bytes, owner.key().as_ref()],
        bump, 
        payer = owner, space = 8 + BlogPost::INIT_SPACE
    )]
    pub blog_post: Account<'info, BlogPost>,
    #[account(mut)]
    pub global_state: Account<'info, GlobalState>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EditPost<'info> {
    #[account(mut, has_one = author)]
    pub blog_post: Account<'info, BlogPost>,
    pub author: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeletePost<'info> {
    #[account(mut, has_one = author, close = author)]
    pub blog_post: Account<'info, BlogPost>,
    #[account(mut)]
    pub global_state: Account<'info, GlobalState>,
    pub author: Signer<'info>,
}

#[derive(Accounts)]
pub struct ListPosts<'info> {
    pub global_state: Account<'info, GlobalState>,
}
