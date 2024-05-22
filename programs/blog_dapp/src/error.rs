use anchor_lang::prelude::*;

#[error_code]
pub enum BlogError {
    #[msg("The title of the blog post is invalid.")]
    InvalidTitle,
    #[msg("The content of the blog post is invalid.")]
    InvalidContent,
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("The blog post limit has been reached.")]
    PostLimitReached,
    #[msg("The specified blog post was not found.")]
    PostNotFound,
}

