const testnet = true;

exports.testnet = testnet;
exports.aa_address = testnet ? "WSZHLCRDJ5PLRYSATRJY7XSB544YBCEQ" : "";
exports.challenge_period_in_days = testnet ? 1/24 : 3;
exports.challenge_min_stake_gb = 0.001;
exports.challenge_coeff = 1.5;
exports.gb_to_bytes = 1000000000;
exports.website_name = "Counterstake.org";
exports.question_max_length = 256;
exports.question_min_length = 10;
exports.min_delay_from_now = 1800; // in seconds
exports.min_reward_for_AA_gb = 0.0001;
exports.min_reward_for_website_gb = 0.01;
