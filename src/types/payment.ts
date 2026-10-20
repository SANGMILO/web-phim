export interface BankConfig {
  bankId: string; // e.g. "MB", "VCB", "TCB", "VPB", "ACB", "BIDV", "ICB", "TPB"
  bankName: string; // e.g. "MB BANK (Quân Đội)"
  accountNumber: string; // e.g. "9988 2233 6688"
  accountHolder: string; // e.g. "CINEVERSE VIETNAM"
  customQrUrl?: string; // Base64 or image URL
  note?: string;
  memoPrefix: string; // e.g. "CV NAP"
}

export interface EWalletConfig {
  phone: string;
  accountHolder: string;
  customQrUrl?: string;
  note?: string;
}

export interface CardGatewayConfig {
  gatewayName: string;
  note: string;
  instructions: string;
}

export interface PaymentMethodStatus {
  vietqr: boolean;
  momo: boolean;
  zalopay: boolean;
  card: boolean;
}

export interface PresetPackage {
  id: string;
  amount: number;
  badge?: string;
  isPopular?: boolean;
}

export interface PaymentSettings {
  methods: PaymentMethodStatus;
  bank: BankConfig;
  momo: EWalletConfig;
  zalopay: EWalletConfig;
  card: CardGatewayConfig;
  presetPackages: PresetPackage[];
  currency: string;
  updatedAt: string;
}

export interface AdminTransactionItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'topup' | 'vip_month' | 'vip_year';
  amount: number;
  description: string;
  createdAt: string;
  status: 'success' | 'pending';
  method: string;
}
