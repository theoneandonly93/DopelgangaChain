-- Validator rewards ledger and leaderboard view

CREATE TABLE IF NOT EXISTS validator_rewards (
    id SERIAL PRIMARY KEY,
    block BIGINT NOT NULL,
    validator TEXT NOT NULL,
    amount BIGINT NOT NULL,
    timestamp BIGINT NOT NULL
);

CREATE OR REPLACE VIEW validator_leaderboard AS
SELECT validator, SUM(amount) AS total_rewards
FROM validator_rewards
GROUP BY validator
ORDER BY total_rewards DESC;

