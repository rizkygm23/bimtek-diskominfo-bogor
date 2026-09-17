<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\PaymentComponent;
use App\Models\BimtekEvent;
use App\Models\User;
use App\Models\TaxParameter;
use App\Models\ParticipantProfile;
use App\Models\SpeakerProfile;
use App\Models\ActivityLog;

class PaymentController extends Controller
{
    /**
     * Slim recipient payload for searchable select (avoids shipping full User models).
     */
    private function mapRecipient(User $user): array
    {
        $golongan = $user->speakerProfileDetail?->golongan
            ?? $user->speakerProfile?->golongan
            ?? null;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'nip_nik' => $user->nip_nik,
            'instansi' => $user->instansi
                ?? $user->participantProfile?->instansi
                ?? $user->speakerProfileDetail?->instansi
                ?? null,
            'golongan' => $golongan,
            'speaker_profile_detail' => $golongan ? ['golongan' => $golongan] : null,
        ];
    }

    private function recipientsQuery(string $type, $eventId = null)
    {
        if ($type === 'pembicara') {
            $query = User::query()
                ->where('role', 'pembicara')
                ->with(['speakerProfileDetail:id,user_id,golongan,instansi']);

            if ($eventId) {
                $query->whereHas('speakerProfile.eventAssignments', function ($q) use ($eventId) {
                    $q->where('bimtek_event_id', $eventId);
                });
            }
        } else {
            $query = User::query()
                ->where('role', 'user')
                ->with(['participantProfile:id,user_id,instansi']);

            if ($eventId) {
                $query->whereHas('registrations', function ($q) use ($eventId) {
                    $q->where('bimtek_event_id', $eventId);
                });
            }
        }

        return $query->orderBy('name');
    }

    public function index(Request $request)
    {
        $type = $request->query('type', 'pembicara'); // 'pembicara' or 'peserta'
        $eventId = $request->query('event_id');

        $events = BimtekEvent::query()
            ->orderBy('start_date', 'desc')
            ->get(['id', 'title', 'start_date', 'end_date', 'status', 'location']);

        $query = PaymentComponent::with(['event', 'user']);

        if ($type === 'pembicara') {
            $query->where('recipient_type', 'pembicara');
        } else {
            $query->where('recipient_type', 'peserta');
        }

        if ($eventId) {
            $query->where('event_id', $eventId);
        }

        $payments = $query->latest()->paginate(15)->withQueryString();
        $taxParameters = TaxParameter::all();

        // Initial list (capped) — full search via searchRecipients endpoint
        $recipients = $this->recipientsQuery($type, $eventId)
            ->limit(80)
            ->get()
            ->map(fn (User $u) => $this->mapRecipient($u))
            ->values();

        return Inertia::render('Admin/Payments/Index', [
            'payments' => $payments,
            'events' => $events,
            'recipients' => $recipients,
            'taxParameters' => $taxParameters,
            'filters' => [
                'type' => $type,
                'event_id' => $eventId,
            ],
        ]);
    }

    /**
     * Async searchable recipients for payment modal (scales past thousands of users).
     */
    public function searchRecipients(Request $request)
    {
        $type = $request->query('type', 'pembicara');
        $eventId = $request->query('event_id');
        $q = trim((string) $request->query('q', ''));

        $query = $this->recipientsQuery($type, $eventId ?: null);

        if ($q !== '') {
            $query->where(function ($inner) use ($q) {
                $inner->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('nip_nik', 'like', "%{$q}%")
                    ->orWhere('instansi', 'like', "%{$q}%");
            });
        }

        $recipients = $query->limit(40)->get()->map(fn (User $u) => $this->mapRecipient($u))->values();

        return response()->json(['recipients' => $recipients]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'event_id' => 'required|exists:bimtek_events,id',
            'user_id' => 'required|exists:users,id',
            'recipient_type' => 'required|in:peserta,pembicara',
            'component_type' => 'required|in:honorarium,uang_jalan,transport',
            'volume' => 'required|numeric|min:0.5',
            'unit' => 'required|string',
            'unit_price' => 'required|numeric|min:0',
            'tax_rate_percent' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
        ]);

        $user = User::findOrFail($validated['user_id']);

        // Auto pre-fill bank & account data from User Profile
        $bankName = '-';
        $accountNumber = '-';
        $accountName = $user->name;

        if ($validated['recipient_type'] === 'peserta' && $user->participantProfile) {
            $bankName = $user->participantProfile->bank_name ?? '-';
            $accountNumber = $user->participantProfile->account_number ?? '-';
            $accountName = $user->participantProfile->account_name ?? $user->name;
        } elseif ($validated['recipient_type'] === 'pembicara' && $user->speakerProfileDetail) {
            $bankName = $user->speakerProfileDetail->bank_name ?? '-';
            $accountNumber = $user->speakerProfileDetail->account_number ?? '-';
            $accountName = $user->speakerProfileDetail->account_name ?? $user->name;
        }

        $gross = $validated['volume'] * $validated['unit_price'];
        $taxRate = $validated['tax_rate_percent'] ?? 0;
        $taxAmount = ($gross * $taxRate) / 100;
        $net = $gross - $taxAmount;

        PaymentComponent::create([
            'event_id' => $validated['event_id'],
            'user_id' => $validated['user_id'],
            'recipient_type' => $validated['recipient_type'],
            'component_type' => $validated['component_type'],
            'volume' => $validated['volume'],
            'unit' => $validated['unit'],
            'unit_price' => $validated['unit_price'],
            'gross_amount' => $gross,
            'tax_rate_percent' => $taxRate,
            'tax_amount' => $taxAmount,
            'net_amount' => $net,
            'bank_name' => $bankName,
            'account_number' => $accountNumber,
            'account_name' => $accountName,
            'payment_status' => 'verified',
            'payment_date' => now(),
            // notes bersifat nullable — key bisa absen dari validated() bila tak dikirim
            'notes' => $validated['notes'] ?? null,
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'CREATE_PAYMENT',
            'module' => 'Administrasi Pembayaran',
            'description' => "Menambahkan rincian pembayaran {$validated['component_type']} untuk {$user->name} sejumlah Rp " . number_format($net, 0, ',', '.'),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', 'Rincian komponen pembayaran berhasil ditambahkan.');
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'payment_status' => 'required|in:pending,verified,processed,paid',
        ]);

        $payment = PaymentComponent::findOrFail($id);
        $payment->update([
            'payment_status' => $request->payment_status,
            'payment_date' => ($request->payment_status === 'paid') ? now() : $payment->payment_date,
        ]);

        return back()->with('success', 'Status pencairan/pembayaran berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $payment = PaymentComponent::findOrFail($id);
        $payment->delete();

        return back()->with('success', 'Data rincian pembayaran berhasil dihapus.');
    }

    // TAX PARAMETERS MANAGEMENT
    public function taxSettings()
    {
        $taxParameters = TaxParameter::all();
        return Inertia::render('Admin/Settings/TaxParameters', [
            'taxParameters' => $taxParameters,
        ]);
    }

    public function storeTaxParameter(Request $request)
    {
        $validated = $request->validate([
            'category_name' => 'required|string|max:255',
            'has_npwp' => 'required|boolean',
            'tax_rate_percent' => 'required|numeric|min:0|max:100',
            'description' => 'nullable|string',
        ]);

        TaxParameter::create($validated);
        return back()->with('success', 'Parameter tarif PPh 21 berhasil ditambahkan.');
    }

    public function updateTaxParameter(Request $request, $id)
    {
        $validated = $request->validate([
            'category_name' => 'required|string|max:255',
            'has_npwp' => 'required|boolean',
            'tax_rate_percent' => 'required|numeric|min:0|max:100',
            'description' => 'nullable|string',
        ]);

        $tax = TaxParameter::findOrFail($id);
        $tax->update($validated);
        return back()->with('success', 'Parameter tarif PPh 21 berhasil diperbarui.');
    }
}
