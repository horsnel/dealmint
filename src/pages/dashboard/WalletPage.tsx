import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Banknote,
  Smartphone,
  History,
  Download,
  Trash2,
  ShieldCheck,
  CheckCircle,
  Eye,
  EyeOff,
  Landmark,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate, formatPrice } from '@/lib/format';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { PayoutAccount, Transaction } from '@/types';

const banks = [
  'Access Bank', 'First Bank', 'GTBank', 'UBA', 'Zenith Bank', 'Fidelity Bank', 'Stanbic IBTC',
  'Sterling Bank', 'Union Bank', 'Wema Bank', 'Kuda', 'Moniepoint',
];

const accountKinds: { value: PayoutAccount['kind']; label: string; description: string; icon: typeof Banknote }[] = [
  { value: 'bank', label: 'Bank Transfer', description: 'Direct to your bank account', icon: Banknote },
  { value: 'opay', label: 'OPay', description: 'Instant to OPay wallet', icon: Smartphone },
  { value: 'palmpay', label: 'PalmPay', description: 'Instant to PalmPay wallet', icon: Smartphone },
  { value: 'momo', label: 'MTN MoMo', description: 'Mobile money transfer', icon: Smartphone },
];

const depositMethods = [
  { value: 'Card', label: 'Debit card', icon: CreditCard },
  { value: 'Bank transfer', label: 'Bank transfer', icon: Landmark },
  { value: 'USSD', label: 'USSD', icon: Hash },
];

const quickAmounts = [1000, 5000, 10000, 20000, 50000];

function kindLabel(kind: PayoutAccount['kind']) {
  return accountKinds.find((k) => k.value === kind)?.label || 'Account';
}

export function WalletPage() {
  usePageTitle('Wallet');
  const {
    user,
    transactions,
    payoutAccounts,
    escrowHeld,
    deposit,
    withdraw,
    addPayoutAccount,
    removePayoutAccount,
  } = useApp();
  const balance = user?.walletBalance ?? 0;

  // Privacy toggle: hide the balance figures on this device (kept per device on purpose)
  const [hideBalance, setHideBalance] = useState(() => {
    try {
      return localStorage.getItem('dealmint_hide_balance') === 'true';
    } catch {
      return false;
    }
  });
  const toggleHideBalance = () => {
    setHideBalance((v) => {
      try {
        localStorage.setItem('dealmint_hide_balance', String(!v));
      } catch {
        // ignore
      }
      return !v;
    });
  };
  const maskedBalance = '₦ ••••••';

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('Card');
  const [depositError, setDepositError] = useState('');

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  const [acctKind, setAcctKind] = useState<PayoutAccount['kind']>('bank');
  const [acctBank, setAcctBank] = useState('');
  const [acctNumber, setAcctNumber] = useState('');
  const [acctName, setAcctName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [acctError, setAcctError] = useState('');

  const handleDeposit = () => {
    const amount = Number(depositAmount);
    if (!depositAmount || !Number.isFinite(amount)) return setDepositError('Enter an amount');
    setDepositError('');
    setBusy(true);
    setTimeout(() => {
      const res = deposit(amount, depositMethod);
      setBusy(false);
      if (!res.ok) return setDepositError(res.error);
      toast.success(`${formatPrice(amount)} added to your wallet`);
      setDepositOpen(false);
      setDepositAmount('');
    }, 1200);
  };

  const openWithdraw = () => {
    if (payoutAccounts.length === 0) {
      toast.info('Add a payout account first');
      setAccountOpen(true);
      return;
    }
    setWithdrawAccount(payoutAccounts[0].id);
    setWithdrawError('');
    setWithdrawOpen(true);
  };

  const handleWithdraw = () => {
    const amount = Number(withdrawAmount);
    if (!withdrawAmount || !Number.isFinite(amount)) return setWithdrawError('Enter an amount');
    setWithdrawError('');
    setBusy(true);
    setTimeout(() => {
      const res = withdraw(amount, withdrawAccount);
      setBusy(false);
      if (!res.ok) return setWithdrawError(res.error);
      toast.success(`${formatPrice(amount)} is on its way to your account`);
      setWithdrawOpen(false);
      setWithdrawAmount('');
    }, 1200);
  };

  const accountNumberValid = () => {
    const digits = acctNumber.replace(/\s/g, '');
    return acctKind === 'bank' ? /^\d{10}$/.test(digits) : /^\d{10,11}$/.test(digits);
  };

  const verifyAccount = () => {
    if (acctKind === 'bank' && !acctBank) return setAcctError('Choose a bank');
    if (!accountNumberValid()) {
      return setAcctError(acctKind === 'bank' ? 'Enter a 10-digit account number' : 'Enter the 10 or 11-digit phone number');
    }
    setAcctError('');
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      // The prototype has no bank lookup, so the account name is taken from the profile
      setAcctName((user?.name || '').toUpperCase());
    }, 900);
  };

  const handleAddAccount = () => {
    if (!acctName) return setAcctError('Verify the account first');
    const digits = acctNumber.replace(/\s/g, '');
    const duplicate = payoutAccounts.some((a) => a.accountNumber === digits && a.kind === acctKind);
    if (duplicate) return setAcctError('You already added this account');
    addPayoutAccount({
      kind: acctKind,
      bankName: acctKind === 'bank' ? acctBank : kindLabel(acctKind),
      accountNumber: digits,
      accountName: acctName,
    });
    toast.success('Payout account added');
    setAccountOpen(false);
    setAcctBank('');
    setAcctNumber('');
    setAcctName('');
    setAcctError('');
  };

  const exportCsv = () => {
    const rows = [
      ['Date', 'Reference', 'Description', 'Type', 'Amount (NGN)', 'Status'],
      ...transactions.map((t) => [
        new Date(t.createdAt).toISOString().slice(0, 10),
        t.reference || '',
        t.description,
        t.type,
        String(t.amount),
        t.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dealmint-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Transactions exported');
  };

  const renderTx = (list: Transaction[]) =>
    list.length > 0 ? (
      <div className="space-y-4">
        {list.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-violet-700/30"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  tx.amount > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                }`}
              >
                {tx.amount > 0 ? (
                  <ArrowDownLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{tx.description}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(tx.createdAt)}
                  {tx.reference ? ` · ${tx.reference}` : ''}
                  {tx.fee ? ` · fee ${formatPrice(tx.fee)}` : ''}
                </p>
              </div>
            </div>
            <span
              className={`font-bold shrink-0 ml-3 ${
                tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {tx.amount > 0 ? '+' : '-'}
              {formatPrice(Math.abs(tx.amount))}
            </span>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nothing here yet</p>
    );

  const earnings = transactions.filter((t) => t.type === 'earning' || t.type === 'bonus' || t.type === 'refund');
  const deposits = transactions.filter((t) => t.type === 'deposit');
  const withdrawals = transactions.filter((t) => t.type === 'withdrawal');
  const payments = transactions.filter((t) => t.type === 'payment');

  const tabClass = 'dark:data-[state=active]:bg-violet-600';

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white mb-6">
          Wallet
        </h1>

        {/* Balance Card */}
        <Card className="mb-8 bg-gradient-to-r from-violet-600 to-violet-800 border-0">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-violet-200">Available Balance</p>
                  <button
                    type="button"
                    onClick={toggleHideBalance}
                    aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
                    aria-pressed={hideBalance}
                    className="p-2 -m-0.5 rounded-full bg-white/10 hover:bg-white/20 text-violet-100 transition-colors"
                  >
                    {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <h2 className="text-4xl lg:text-5xl font-display font-bold text-white">
                  {hideBalance ? maskedBalance : formatPrice(balance)}
                </h2>
                {escrowHeld > 0 && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 max-w-full">
                    <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
                    <span className="text-sm text-violet-100 truncate">
                      <span className="font-semibold text-white">
                        {hideBalance ? maskedBalance : formatPrice(escrowHeld)}
                      </span>{' '}
                      in escrow for your open orders
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setDepositError('');
                    setDepositOpen(true);
                  }}
                  variant="secondary"
                  className="bg-white text-violet-600 hover:bg-gray-100"
                >
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  Deposit
                </Button>
                <Button onClick={openWithdraw} className="bg-amber-500 hover:bg-amber-600 text-white">
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Withdraw
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transactions */}
          <div className="lg:col-span-2">
            <Card className="dark:bg-violet-800 dark:border-violet-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Transaction History
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={transactions.length === 0}
                  onClick={exportCsv}
                  className="dark:border-violet-600 dark:text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <EmptyState
                    icon={History}
                    title="No transactions yet"
                    description="Deposits, payments and earnings will show up here."
                  />
                ) : (
                  <Tabs defaultValue="all">
                    <TabsList className="mb-4 dark:bg-violet-700 flex-wrap h-auto">
                      <TabsTrigger value="all" className={tabClass}>All</TabsTrigger>
                      <TabsTrigger value="earnings" className={tabClass}>Earnings</TabsTrigger>
                      <TabsTrigger value="payments" className={tabClass}>Payments</TabsTrigger>
                      <TabsTrigger value="deposits" className={tabClass}>Deposits</TabsTrigger>
                      <TabsTrigger value="withdrawals" className={tabClass}>Withdrawals</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all">{renderTx(transactions)}</TabsContent>
                    <TabsContent value="earnings">{renderTx(earnings)}</TabsContent>
                    <TabsContent value="payments">{renderTx(payments)}</TabsContent>
                    <TabsContent value="deposits">{renderTx(deposits)}</TabsContent>
                    <TabsContent value="withdrawals">{renderTx(withdrawals)}</TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payout Methods */}
          <div>
            <Card className="dark:bg-violet-800 dark:border-violet-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payout Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payoutAccounts.length > 0 ? (
                  <div className="space-y-4">
                    {payoutAccounts.map((a) => {
                      const Icon = accountKinds.find((k) => k.value === a.kind)?.icon || Banknote;
                      return (
                        <div
                          key={a.id}
                          className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-violet-700"
                        >
                          <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-700 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-violet-600 dark:text-violet-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{a.bankName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              ••••{a.accountNumber.slice(-4)} · {a.accountName}
                            </p>
                          </div>
                          <button
                            aria-label={`Remove ${a.bankName} account`}
                            onClick={() => {
                              removePayoutAccount(a.id);
                              toast.success('Payout account removed');
                            }}
                            className="p-2.5 -m-2.5 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Add a bank or mobile money account to withdraw your earnings.
                  </p>
                )}

                <Button
                  onClick={() => {
                    setAcctError('');
                    setAcctName('');
                    setAccountOpen(true);
                  }}
                  variant="outline"
                  className="w-full mt-4 dark:border-violet-600 dark:text-white"
                >
                  Add New Method
                </Button>
              </CardContent>
            </Card>

            {/* Fee Info */}
            <Card className="mt-6 dark:bg-violet-800 dark:border-violet-700">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Fee Structure</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Student:</span>
                    <span className="font-medium text-gray-900 dark:text-white">10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">General:</span>
                    <span className="font-medium text-gray-900 dark:text-white">15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Withdrawal:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">Free</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Your rate: {user?.role === 'student' ? '10% (student)' : '15% (general)'}.{' '}
                  {user?.role !== 'student' && (
                    <Link to="/dashboard/profile" className="inline-block py-2.5 -my-2.5 text-violet-600 dark:text-amber-400 underline">
                      Verify as a student
                    </Link>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Deposit */}
      <Dialog open={depositOpen} onOpenChange={(o) => !busy && setDepositOpen(o)}>
        <DialogContent className="dark:bg-violet-900 dark:border-violet-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Deposit funds</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Add money to your wallet to pay for orders. Minimum ₦500.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deposit-amount" className="dark:text-gray-200">Amount (₦)</Label>
              <Input
                id="deposit-amount"
                type="number"
                inputMode="numeric"
                min="500"
                value={depositAmount}
                onChange={(e) => {
                  setDepositAmount(e.target.value);
                  setDepositError('');
                }}
                placeholder="5000"
                className="mt-1 dark:bg-violet-700 dark:border-violet-600"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {quickAmounts.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setDepositAmount(String(a))}
                    className="text-xs px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-700 text-violet-700 dark:text-violet-100 hover:bg-violet-200"
                  >
                    {formatPrice(a)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="dark:text-gray-200">Pay with</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {depositMethods.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setDepositMethod(m.value)}
                    aria-pressed={depositMethod === m.value}
                    className={`p-3 rounded-lg border text-sm flex flex-col items-center gap-1 transition-colors ${
                      depositMethod === m.value
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-700 text-violet-700 dark:text-white'
                        : 'border-gray-200 dark:border-violet-600 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <m.icon className="w-5 h-5" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Prototype note: no real payment is taken. Funds are added instantly for testing.
            </p>
            {depositError && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">{depositError}</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setDepositOpen(false)} className="dark:border-violet-600 dark:text-white">
              Cancel
            </Button>
            <Button onClick={handleDeposit} disabled={busy} className="bg-violet-600 hover:bg-violet-700">
              {busy ? 'Processing...' : 'Deposit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw */}
      <Dialog open={withdrawOpen} onOpenChange={(o) => !busy && setWithdrawOpen(o)}>
        <DialogContent className="dark:bg-violet-900 dark:border-violet-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Withdraw funds</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Available: {formatPrice(balance)}. Withdrawals are free. Minimum ₦1,000.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="dark:text-gray-200">Send to</Label>
              <Select value={withdrawAccount} onValueChange={setWithdrawAccount}>
                <SelectTrigger className="mt-1 dark:bg-violet-700 dark:border-violet-600">
                  <SelectValue placeholder="Choose an account" />
                </SelectTrigger>
                <SelectContent>
                  {payoutAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.bankName} ••••{a.accountNumber.slice(-4)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="withdraw-amount" className="dark:text-gray-200">Amount (₦)</Label>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(String(balance))}
                  className="text-xs text-violet-600 dark:text-amber-400 hover:underline"
                >
                  Withdraw all
                </button>
              </div>
              <Input
                id="withdraw-amount"
                type="number"
                inputMode="numeric"
                min="1000"
                value={withdrawAmount}
                onChange={(e) => {
                  setWithdrawAmount(e.target.value);
                  setWithdrawError('');
                }}
                placeholder="10000"
                className="mt-1 dark:bg-violet-700 dark:border-violet-600"
              />
            </div>
            {withdrawError && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">{withdrawError}</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setWithdrawOpen(false)} className="dark:border-violet-600 dark:text-white">
              Cancel
            </Button>
            <Button onClick={handleWithdraw} disabled={busy} className="bg-violet-600 hover:bg-violet-700">
              {busy ? 'Processing...' : 'Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add account */}
      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent className="dark:bg-violet-900 dark:border-violet-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Add payout method</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Where should we send your withdrawals?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="dark:text-gray-200">Type</Label>
              <Select
                value={acctKind}
                onValueChange={(v) => {
                  setAcctKind(v as PayoutAccount['kind']);
                  setAcctName('');
                  setAcctError('');
                }}
              >
                <SelectTrigger className="mt-1 dark:bg-violet-700 dark:border-violet-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountKinds.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {acctKind === 'bank' && (
              <div>
                <Label className="dark:text-gray-200">Bank</Label>
                <Select
                  value={acctBank}
                  onValueChange={(v) => {
                    setAcctBank(v);
                    setAcctName('');
                  }}
                >
                  <SelectTrigger className="mt-1 dark:bg-violet-700 dark:border-violet-600">
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="acct-number" className="dark:text-gray-200">
                {acctKind === 'bank' ? 'Account number' : 'Phone number on the wallet'}
              </Label>
              <Input
                id="acct-number"
                inputMode="numeric"
                maxLength={11}
                value={acctNumber}
                onChange={(e) => {
                  setAcctNumber(e.target.value.replace(/\D/g, ''));
                  setAcctName('');
                  setAcctError('');
                }}
                placeholder={acctKind === 'bank' ? '0123456789' : '08031234567'}
                className="mt-1 dark:bg-violet-700 dark:border-violet-600"
              />
            </div>
            {acctName ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-sm">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {acctName}
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={verifyAccount}
                disabled={verifying}
                className="w-full dark:border-violet-600 dark:text-white"
              >
                {verifying ? 'Verifying...' : 'Verify account'}
              </Button>
            )}
            {acctError && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">{acctError}</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setAccountOpen(false)} className="dark:border-violet-600 dark:text-white">
              Cancel
            </Button>
            <Button onClick={handleAddAccount} disabled={!acctName} className="bg-violet-600 hover:bg-violet-700">
              Save account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
