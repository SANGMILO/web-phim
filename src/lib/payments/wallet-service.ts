'use client';

import { createClient } from '@/lib/supabase/client';
import type { PaymentSettings, AdminTransactionItem } from '@/types/payment';
import type { WalletTransaction } from '@/lib/profile/profile-service';
import { DEFAULT_PAYMENT_SETTINGS } from './payment-service';

export interface TopupRequest {
  id: string;
  amount: number;
  currency: 'VND';
  method: 'vietqr';
  paymentCode: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  expiresAt: string;
  paidAt?: string;
}

export interface WalletSnapshot {
  balance: number;
  transactions: WalletTransaction[];
  pendingTopups: TopupRequest[];
  settings: PaymentSettings;
}

type UnknownRow = Record<string, unknown>;

function asRecord(value: unknown): UnknownRow {
  return value && typeof value === 'object' ? (value as UnknownRow) : {};
}

function asPaymentSettings(value: unknown): PaymentSettings {
  const row = asRecord(value);
  return {
    methods: {
      ...DEFAULT_PAYMENT_SETTINGS.methods,
      ...asRecord(row.methods),
    },
    bank: {
      ...DEFAULT_PAYMENT_SETTINGS.bank,
      ...asRecord(row.bank),
    },
    momo: {
      ...DEFAULT_PAYMENT_SETTINGS.momo,
      ...asRecord(row.momo),
    },
    zalopay: {
      ...DEFAULT_PAYMENT_SETTINGS.zalopay,
      ...asRecord(row.zalopay),
    },
    card: {
      ...DEFAULT_PAYMENT_SETTINGS.card,
      ...asRecord(row.card),
    },
    presetPackages: Array.isArray(row.preset_packages)
      ? (row.preset_packages as PaymentSettings['presetPackages'])
      : Array.isArray(row.presetPackages)
        ? (row.presetPackages as PaymentSettings['presetPackages'])
        : DEFAULT_PAYMENT_SETTINGS.presetPackages,
    currency: typeof row.currency === 'string' ? row.currency : 'VND',
    updatedAt:
      typeof row.updated_at === 'string'
        ? row.updated_at
        : typeof row.updatedAt === 'string'
          ? row.updatedAt
          : new Date(0).toISOString(),
  };
}

function asTopupRequest(value: unknown): TopupRequest {
  const row = asRecord(value);
  return {
    id: String(row.id || ''),
    amount: Number(row.amount || 0),
    currency: 'VND',
    method: 'vietqr',
    paymentCode: String(row.payment_code || row.paymentCode || ''),
    status: String(row.status || 'pending') as TopupRequest['status'],
    expiresAt: String(row.expires_at || row.expiresAt || ''),
    paidAt: typeof row.paid_at === 'string' ? row.paid_at : undefined,
  };
}

function getMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export const walletService = {
  async getPaymentSettings(): Promise<PaymentSettings> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('payment_settings')
      .select('methods,bank,momo,zalopay,card,preset_packages,currency,updated_at')
      .eq('id', 1)
      .single();

    if (error) throw new Error(error.message);
    return asPaymentSettings(data);
  },

  async getSnapshot(userId: string): Promise<WalletSnapshot> {
    const supabase = createClient();
    const [walletResult, ledgerResult, topupsResult, settings] = await Promise.all([
      supabase.from('wallet_accounts').select('balance').eq('user_id', userId).maybeSingle(),
      supabase
        .from('wallet_ledger_entries')
        .select('id,entry_type,amount,description,created_at,provider')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('wallet_topup_requests')
        .select('id,amount,currency,method,payment_code,status,expires_at,paid_at')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5),
      this.getPaymentSettings(),
    ]);

    if (walletResult.error) throw new Error(walletResult.error.message);
    if (ledgerResult.error) throw new Error(ledgerResult.error.message);
    if (topupsResult.error) throw new Error(topupsResult.error.message);

    const transactions: WalletTransaction[] = (ledgerResult.data || []).map((item) => ({
      id: item.id,
      type:
        item.entry_type === 'vip_month' || item.entry_type === 'vip_year'
          ? item.entry_type
          : 'topup',
      amount: Number(item.amount),
      description: item.description,
      createdAt: item.created_at,
      status: 'success',
      method: item.provider === 'sepay' ? 'VietQR / SePay' : 'Ví CineVerse',
    }));

    return {
      balance: Number(walletResult.data?.balance || 0),
      transactions,
      pendingTopups: (topupsResult.data || []).map(asTopupRequest),
      settings,
    };
  },

  async createTopup(amount: number): Promise<TopupRequest> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('create_topup_request', {
      requested_amount: amount,
      requested_method: 'vietqr',
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error('Không thể tạo yêu cầu nạp tiền.');
    return asTopupRequest(row);
  },

  async getTopup(requestId: string): Promise<TopupRequest | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('wallet_topup_requests')
      .select('id,amount,currency,method,payment_code,status,expires_at,paid_at')
      .eq('id', requestId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? asTopupRequest(data) : null;
  },

  async purchaseVip(plan: 'vip_month' | 'vip_year') {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('purchase_vip', { wallet_plan: plan });
    if (error) throw new Error(error.message);
    const row = asRecord(Array.isArray(data) ? data[0] : data);
    return {
      balance: Number(row.balance || 0),
      vipExpiresAt: String(row.vip_expires_at || ''),
    };
  },

  async updatePaymentSettings(settings: PaymentSettings): Promise<PaymentSettings> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('admin_update_payment_settings', {
      new_settings: settings,
    });
    if (error) throw new Error(error.message);
    return asPaymentSettings(data);
  },

  async getAdminTransactions(): Promise<AdminTransactionItem[]> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('admin_list_wallet_transactions');
    if (error) throw new Error(error.message);

    return (Array.isArray(data) ? data : []).map((value) => {
      const row = asRecord(value);
      return {
        id: String(row.id || ''),
        userId: String(row.user_id || ''),
        userName: String(row.user_name || 'Người dùng'),
        userEmail: String(row.user_email || ''),
        type:
          row.type === 'vip_month' || row.type === 'vip_year'
            ? row.type
            : 'topup',
        amount: Number(row.amount || 0),
        description: String(row.description || 'Giao dịch nạp tiền'),
        createdAt: String(row.created_at || new Date(0).toISOString()),
        status: row.status === 'success' ? 'success' : 'pending',
        method: String(row.method || 'VietQR / SePay'),
      };
    });
  },

  async adjustWallet(userId: string, amount: number, memo: string): Promise<number> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('admin_adjust_wallet', {
      target_user_id: userId,
      adjustment_amount: amount,
      adjustment_memo: memo,
    });
    if (error) throw new Error(getMessage(error, 'Không thể điều chỉnh số dư.'));
    return Number(data || 0);
  },
};

