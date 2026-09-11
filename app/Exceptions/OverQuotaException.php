<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Dilempar ketika pendaftaran ke suatu BIMTEK gagal karena kuota penuh.
 *
 * Dipakai di RegistrationController::store di dalam DB::transaction +
 * lockForUpdate untuk menutup race condition TOCTOU pada quota check.
 */
class OverQuotaException extends RuntimeException
{
    public function __construct(string $message = 'Kuota pendaftaran sudah penuh.')
    {
        parent::__construct($message);
    }
}
