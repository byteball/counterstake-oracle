const testnet = true;

exports.testnet = testnet;
exports.aa_address = testnet ? "YGJ7SEDM4RTDW2AIYXLCAQX6WKMQGDLR" : "";
exports.min_reward_gb = 0.1;
exports.challenge_period_in_days = testnet ? 1/24 : 3;
exports.challenge_min_stake_gb = 0.001;
exports.challenge_coeff = 1.5;
exports.gb_to_bytes = 1000000000;
exports.website_name = "Counterstake.com";

