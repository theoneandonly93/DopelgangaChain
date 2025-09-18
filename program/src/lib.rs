use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Transfer as SplTransfer};

declare_id!("Dopelganga1111111111111111111111111111111111"); // replace with your deployed ID

#[program]
pub mod dopelgangachain {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("🚀 DopelgangaChain initialized!");
        Ok(())
    }

    // Transfer Dopel inside the layer (with fee splits)
    pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
        let fee_challenge = amount * 4 / 100;
        let fee_dev = amount * 2 / 100;
        let fee_liq = amount * 2 / 100;
        let net_amount = amount - fee_challenge - fee_dev - fee_liq;

        // send Dopel tokens using Anchor SPL
        let cpi_accounts = SplTransfer {
            from: ctx.accounts.from_token.to_account_info(),
            to: ctx.accounts.to_token.to_account_info(),
            authority: ctx.accounts.from.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, net_amount)?;

        // fees can be routed similarly (challenge_wallet, dev_wallet, liquidity_wallet)
        emit!(LayerTx {
            from: ctx.accounts.from.key(),
            to: ctx.accounts.to.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    // Mint Dopel to a user (airdrop / rewards)
    pub fn mint_dopel(ctx: Context<MintDopel>, amount: u64) -> Result<()> {
        let cpi_accounts = MintTo {
            mint: ctx.accounts.dopel_mint.to_account_info(),
            to: ctx.accounts.to_token.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    /// CHECK: user account receiving tokens
    pub to: AccountInfo<'info>,
    #[account(mut)]
    pub from_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MintDopel<'info> {
    #[account(mut)]
    pub dopel_mint: Account<'info, Mint>,
    #[account(mut)]
    pub to_token: Account<'info, TokenAccount>,
    /// CHECK: PDA authority for minting
    pub mint_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[event]
pub struct LayerTx {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}
