<?php
/**
 * Money Formatting Helper
 *
 * Handles conversion between Swedish öre (minor currency unit) and SEK (major currency)
 * All amounts in the database are stored as integers in öre (100 öre = 1 SEK)
 *
 * Usage:
 *   require_once('lib/money.php');
 *   echo format_sek_from_ore(10000); // Output: "100,00 kr"
 */

/**
 * Convert öre to SEK with proper Swedish formatting
 *
 * @param int|null $ore Amount in öre (smallest currency unit)
 * @param int $decimals Number of decimal places (default 2)
 * @return string Formatted amount in SEK with Swedish formatting (comma as decimal separator)
 */
function format_sek_from_ore($ore, $decimals = 2) {
    // Handle null or invalid values
    if ($ore === null || !is_numeric($ore)) {
        error_log("Warning: format_sek_from_ore received invalid value: " . var_export($ore, true));
        return '0,00 kr';
    }

    // Convert 100 öre = 1.00 SEK
    $sek = $ore / 100;

    // Swedish formatting: comma as decimal separator, space as thousands separator
    return number_format($sek, $decimals, ',', ' ') . ' kr';
}

function format_sek_from_kr($sek, $decimals = 2) {
    // Handle null or invalid values
    if ($sek === null || !is_numeric($sek)) {
        error_log("Warning: format_sek_from_kr received invalid value: " . var_export($sek, true));
        return '0,00 kr';
    }

    // Swedish formatting: comma as decimal separator, space as thousands separator
    return number_format($sek, $decimals, ',', ' ') . ' kr';
}

/**
 * Convert SEK to öre (for user input processing)
 *
 * @param float $sek Amount in SEK
 * @return int Amount in öre
 */
function sek_to_ore($sek) {
    if ($sek === null || !is_numeric($sek)) {
        return 0;
    }
    return (int) round($sek * 100);
}

/**
 * Calculate 85/15 split for trainer payout
 * Trainer receives 85%, platform takes 15%
 *
 * @param int $grossAmountOre Total amount in öre paid by customer
 * @return array ['trainer_amount' => int, 'platform_fee' => int]
 */
function calculate_payout_split($grossAmountOre) {
    if (!is_numeric($grossAmountOre) || $grossAmountOre < 0) {
        return [
            'trainer_amount' => 0,
            'platform_fee' => 0
        ];
    }

    $trainerAmount = (int) round($grossAmountOre * 0.85);
    $platformFee = $grossAmountOre - $trainerAmount; // Ensures sum equals gross

    return [
        'trainer_amount' => $trainerAmount,
        'platform_fee' => $platformFee
    ];
}
