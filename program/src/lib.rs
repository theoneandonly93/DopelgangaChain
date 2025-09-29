use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{
        self, Mint, Token, TokenAccount, MintTo, Transfer as SplTransfer,
        InitializeMint2, // for launchpad
        SetAuthority,
    },
};

declare_id!("HAzZhRcVrrFWYU9K4nWCSvpgLLcMSb9GZRfrcs3bYfDP"); // REPLACE AFTER DEPLOY

// -------------------------------
// PDA seeds
// -------------------------------
const CFG_SEED: &[u8] = b"cfg";          // global config (mints, fee wallets, mint auth)
const REF_SEED: &[u8] = b"ref";          // referral record per user
const LAUNCH_SEED: &[u8] = b"launch";    // launch counter / authority PDA

#[program]
pub mod dopelgangachain {
    use super::*;

    // -----------------------------------------------------------
    // 1) Initialize global config (set Dopel mint + fee wallets)
    // -----------------------------------------------------------
    pub fn initialize(
        ctx: Context<Initialize>,
        _bump_cfg: u8,
        dopel_mint: Pubkey,
        challenge_wallet: Pubkey,
        dev_wallet: Pubkey,
        liq_wallet: Pubkey,
    ) -> Result<()> {
        let cfg = &mut ctx.accounts.cfg;
        cfg.admin = ctx.accounts.admin.key();
        cfg.dopel_mint = dopel_mint;
        cfg.challenge_wallet = challenge_wallet;
        cfg.dev_wallet = dev_wallet;
        cfg.liq_wallet = liq_wallet;
        cfg.reward_per_block = 0;
        cfg.governance = ctx.accounts.admin.key();
        Ok(())
    }

    // -----------------------------------------------------------
    // 2) Mint Dopel (airdrop / rewards) - admin gated by CFG PDA
    // -----------------------------------------------------------
    pub fn mint_dopel(ctx: Context<MintDopel>, amount: u64) -> Result<()> {
        // Only admin may mint Dopel via cfg signer
        require_keys_eq!(ctx.accounts.cfg.admin, ctx.accounts.admin.key(), ErrorCode::Unauthorized);

        let cpi_accounts = MintTo {
            mint: ctx.accounts.dopel_mint.to_account_info(),
            to: ctx.accounts.to_token.to_account_info(),
            authority: ctx.accounts.cfg.to_account_info(), // cfg PDA signs
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let seeds: &[&[u8]] = &[CFG_SEED, &[ctx.bumps.cfg]];
        let signer = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::mint_to(cpi_ctx, amount)?;

        emit!(Airdrop {
            to: ctx.accounts.to_token.owner,
            amount
        });
        Ok(())
    }

    // -----------------------------------------------------------
    // 3) Transfer Dopel with fee routing (4/2/2)
    // -----------------------------------------------------------
    pub fn transfer_with_fees(ctx: Context<TransferWithFees>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let fee_chal = amount.saturating_mul(4).checked_div(100).unwrap();
        let fee_dev  = amount.saturating_mul(2).checked_div(100).unwrap();
        let fee_liq  = amount.saturating_mul(2).checked_div(100).unwrap();
        let net      = amount.saturating_sub(fee_chal + fee_dev + fee_liq);

        // Move net to recipient
        cpi_transfer(
            &ctx.accounts.token_program,
            &ctx.accounts.from,
            &ctx.accounts.from_token,
            &ctx.accounts.to_token,
            net,
        )?;

        // Route fees
        cpi_transfer(
            &ctx.accounts.token_program,
            &ctx.accounts.from,
            &ctx.accounts.from_token,
            &ctx.accounts.challenge_token,
            fee_chal,
        )?;
        cpi_transfer(
            &ctx.accounts.token_program,
            &ctx.accounts.from,
            &ctx.accounts.from_token,
            &ctx.accounts.dev_token,
            fee_dev,
        )?;
        cpi_transfer(
            &ctx.accounts.token_program,
            &ctx.accounts.from,
            &ctx.accounts.from_token,
            &ctx.accounts.liq_token,
            fee_liq,
        )?;

        emit!(LayerTx {
            from: ctx.accounts.from.key(),
            to: ctx.accounts.to_token.owner,
            gross_amount: amount,
            net_amount: net,
            fee_challenge: fee_chal,
            fee_dev,
            fee_liq,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    // -----------------------------------------------------------
    // 4) Bind referral (once) and optionally reward inviter
    // -----------------------------------------------------------
    pub fn bind_referral(ctx: Context<BindReferral>, reward_amount: u64) -> Result<()> {
        let rec = &mut ctx.accounts.ref_record;
        require!(!rec.bound, ErrorCode::AlreadyBound);
        require_keys_neq!(ctx.accounts.user.key(), ctx.accounts.inviter.key(), ErrorCode::SelfInvite);

        rec.bound = true;
        rec.user = ctx.accounts.user.key();
        rec.inviter = ctx.accounts.inviter.key();

        // reward inviter with Dopel (adminless via cfg PDA)
        if reward_amount > 0 {
            let cpi_accounts = MintTo {
                mint: ctx.accounts.dopel_mint.to_account_info(),
                to: ctx.accounts.inviter_token.to_account_info(),
                authority: ctx.accounts.cfg.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let seeds: &[&[u8]] = &[CFG_SEED, &[ctx.bumps.cfg]];
            let signer = &[&seeds[..]];
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::mint_to(cpi_ctx, reward_amount)?;
        }

        emit!(Referral {
            user: rec.user,
            inviter: rec.inviter,
            reward_amount
        });
        Ok(())
    }

    // -----------------------------------------------------------
    // 5) Launchpad: create a new SPL mint (chain-native token)
    //    Owner = CFG PDA by default (you can change)
    // -----------------------------------------------------------
    pub fn launch_token(
        ctx: Context<LaunchToken>,
        decimals: u8,
        initial_mint_to: u64,
    ) -> Result<()> {
        // Initialize the mint (already allocated via system_program in accounts)
        let cpi_prog = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(
            cpi_prog,
            InitializeMint2 {
                mint: ctx.accounts.new_mint.to_account_info(),
            },
        );
        token::initialize_mint2(cpi_ctx, decimals, &ctx.accounts.cfg.key(), None)?;

        // Create ATA for recipient (if not created by client; we enforce it here)
        if ctx.accounts.recipient_token.owner != ctx.accounts.recipient.key() {
            return err!(ErrorCode::InvalidATAOwner);
        }

        // Mint initial supply from CFG PDA signer
        if initial_mint_to > 0 {
            let cpi_accounts = MintTo {
                mint: ctx.accounts.new_mint.to_account_info(),
                to: ctx.accounts.recipient_token.to_account_info(),
                authority: ctx.accounts.cfg.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let seeds: &[&[u8]] = &[CFG_SEED, &[ctx.bumps.cfg]];
            let signer = &[&seeds[..]];
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::mint_to(cpi_ctx, initial_mint_to)?;
        }

        emit!(TokenLaunched {
            mint: ctx.accounts.new_mint.key(),
            recipient: ctx.accounts.recipient.key(),
            initial_mint_to,
            decimals
        });

        Ok(())
    }

    // -----------------------------------------------------------
    // 6) Mint validator reward (inflation) - signed by CFG PDA
    // -----------------------------------------------------------
    pub fn mint_validator_reward(ctx: Context<MintValidatorReward>) -> Result<()> {
        let cfg = &ctx.accounts.cfg;

        let reward_amount: u64 = cfg.reward_per_block;

        let cpi_accounts = MintTo {
            mint: ctx.accounts.dopel_mint.to_account_info(),
            to: ctx.accounts.validator_token_account.to_account_info(),
            authority: ctx.accounts.cfg.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let seeds: &[&[u8]] = &[CFG_SEED, &[ctx.bumps.cfg]];
        let signer = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::mint_to(cpi_ctx, reward_amount)?;

        let slot = Clock::get()?.slot;
        let ts = Clock::get()?.unix_timestamp;

        // Anchor event + JSON log for indexer
        emit!(ValidatorReward {
            validator: ctx.accounts.validator.key(),
            amount: reward_amount,
            block: slot,
            timestamp: ts,
        });
        msg!(
            "{}",
            format!(
                "{{\"event\":\"ValidatorReward\",\"validator\":\"{}\",\"amount\":{},\"block\":{},\"timestamp\":{}}}",
                ctx.accounts.validator.key(),
                reward_amount,
                slot,
                ts
            )
        );

        Ok(())
    }

    // -----------------------------------------------------------
    // 7) Update config (reward per block) - governance only
    // -----------------------------------------------------------
    pub fn update_config(ctx: Context<UpdateConfig>, new_reward: u64) -> Result<()> {
        let cfg = &mut ctx.accounts.cfg;
        cfg.reward_per_block = new_reward;
        msg!(
            "{}",
            format!("{{\"event\":\"UpdateConfig\",\"reward_per_block\":{}}}", new_reward)
        );
        Ok(())
    }

    // -----------------------------------------------------------
    // 8) Governance: set mint authority (e.g., temporarily to wallet to set metadata)
    // -----------------------------------------------------------
    pub fn set_mint_authority(ctx: Context<SetMintAuthority>) -> Result<()> {
        // current authority = cfg PDA signer
        let seeds: &[&[u8]] = &[CFG_SEED, &[ctx.bumps.cfg]];
        let signer = &[&seeds[..]];
        let cpi_accounts = SetAuthority {
            account_or_mint: ctx.accounts.dopel_mint.to_account_info(),
            current_authority: ctx.accounts.cfg.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::set_authority(
            cpi_ctx,
            spl_token::instruction::AuthorityType::MintTokens,
            Some(ctx.accounts.new_mint_authority.key()),
        )?;
        msg!(
            "{}",
            format!(
                "{{\"event\":\"SetMintAuthority\",\"new\":\"{}\"}}",
                ctx.accounts.new_mint_authority.key()
            )
        );
        Ok(())
    }
}

// -------------------------------
// Helper: SPL transfer by signer
// -------------------------------
fn cpi_transfer(
    token_program: &Program<Token>,
    from_signer: &Signer,
    from_token: &Account<TokenAccount>,
    to_token: &Account<TokenAccount>,
    amount: u64,
) -> Result<()> {
    if amount == 0 { return Ok(()); }
    let cpi_accounts = SplTransfer {
        from: from_token.to_account_info(),
        to: to_token.to_account_info(),
        authority: from_signer.to_account_info(),
    };
    let cpi_program = token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)
}

// -------------------------------
// Accounts
// -------------------------------
#[account]
pub struct Config {
    pub admin: Pubkey,
    pub dopel_mint: Pubkey,
    pub challenge_wallet: Pubkey,
    pub dev_wallet: Pubkey,
    pub liq_wallet: Pubkey,
    pub reward_per_block: u64,
    pub governance: Pubkey,
}

#[derive(Accounts)]
#[instruction(_bump_cfg: u8)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        seeds = [CFG_SEED],
        bump,
        payer = admin,
        space = 8 + 32*6 + 8
    )]
    pub cfg: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintDopel<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(seeds = [CFG_SEED], bump)]
    pub cfg: Account<'info, Config>,
    /// CHECK: Dopel mint
    pub dopel_mint: Account<'info, Mint>,
    #[account(mut)]
    pub to_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferWithFees<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    #[account(mut)]
    pub from_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_token: Account<'info, TokenAccount>,

    // Fee destinations (ATAs for Dopel mint)
    #[account(mut)]
    pub challenge_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub dev_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub liq_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct ReferralRecord {
    pub bound: bool,
    pub user: Pubkey,
    pub inviter: Pubkey,
}

#[derive(Accounts)]
pub struct BindReferral<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: inviter is any wallet
    pub inviter: AccountInfo<'info>,

    #[account(
        init_if_needed,
        seeds = [REF_SEED, user.key().as_ref()],
        bump,
        payer = user,
        space = 8 + 1 + 32 + 32
    )]
    pub ref_record: Account<'info, ReferralRecord>,

    #[account(seeds = [CFG_SEED], bump)]
    pub cfg: Account<'info, Config>,

    /// CHECK: Dopel mint (must equal cfg.dopel_mint; we enforce)
    #[account(address = cfg.dopel_mint)]
    pub dopel_mint: Account<'info, Mint>,

    #[account(mut)]
    pub inviter_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LaunchToken<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    // Config signs as mint authority
    #[account(seeds = [CFG_SEED], bump)]
    pub cfg: Account<'info, Config>,

    // New mint account must already be created & rent-exempt by client using system_program
    /// CHECK: new mint to be initialized
    #[account(mut)]
    pub new_mint: AccountInfo<'info>,

    /// Recipient & their ATA (must be for new_mint and owned by recipient)
    pub recipient: SystemAccount<'info>,
    #[account(mut)]
    pub recipient_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintValidatorReward<'info> {
    #[account(mut, seeds = [CFG_SEED], bump)]
    pub cfg: Account<'info, Config>,
    /// CHECK: must match cfg.dopel_mint
    #[account(mut, address = cfg.dopel_mint)]
    pub dopel_mint: Account<'info, Mint>,
    #[account(mut)]
    pub validator_token_account: Account<'info, TokenAccount>,
    /// CHECK: validator wallet signer
    pub validator: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut, has_one = governance)]
    pub cfg: Account<'info, Config>,
    pub governance: Signer<'info>,
}

// -------------------------------
// Events
// -------------------------------
#[event]
pub struct LayerTx {
    pub from: Pubkey,
    pub to: Pubkey,
    pub gross_amount: u64,
    pub net_amount: u64,
    pub fee_challenge: u64,
    pub fee_dev: u64,
    pub fee_liq: u64,
    pub timestamp: i64,
}

#[event]
pub struct Airdrop {
    pub to: Pubkey,
    pub amount: u64,
}

#[event]
pub struct Referral {
    pub user: Pubkey,
    pub inviter: Pubkey,
    pub reward_amount: u64,
}

#[event]
pub struct TokenLaunched {
    pub mint: Pubkey,
    pub recipient: Pubkey,
    pub initial_mint_to: u64,
    pub decimals: u8,
}

#[event]
pub struct ValidatorReward {
    pub validator: Pubkey,
    pub amount: u64,
    pub block: u64,
    pub timestamp: i64,
}

#[derive(Accounts)]
pub struct SetMintAuthority<'info> {
    #[account(mut, has_one = governance, seeds = [CFG_SEED], bump)]
    pub cfg: Account<'info, Config>,
    pub governance: Signer<'info>,
    #[account(mut, address = cfg.dopel_mint)]
    pub dopel_mint: Account<'info, Mint>,
    /// CHECK: new authority for mint
    pub new_mint_authority: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
}

// -------------------------------
// Errors
// -------------------------------
#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Referral already bound")]
    AlreadyBound,
    #[msg("User cannot invite themselves")]
    SelfInvite,
    #[msg("Recipient ATA owner mismatch")]
    InvalidATAOwner,
}
