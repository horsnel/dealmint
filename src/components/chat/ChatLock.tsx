import { Lock, Shield, Wallet, ArrowRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';

// Escrow-gated chat (adapted from Postall's ChatLock) in two flavours:
// - "pay":    the buyer side — pay into escrow to unlock the conversation.
// - "waiting": the request recipient — chat opens when the other side funds
//             escrow, or they can waive the lock and reply anyway.
// Dealmint styling: violet button, soft rounded card, dashed border.
export function ChatLock({
  mode,
  otherName,
  listingTitle,
  listingId,
  price,
  canAfford = true,
  shortfall = 0,
  onUnlock,
  onAddFunds,
  onWaive,
}: {
  mode: 'pay' | 'waiting';
  otherName: string;
  listingTitle: string;
  listingId?: string;
  price: number;
  canAfford?: boolean;
  shortfall?: number;
  onUnlock?: () => void;
  onAddFunds?: () => void;
  onWaive?: () => void;
}) {
  return (
    <div className="p-3 border-t dark:border-violet-700 shrink-0">
      <div className="rounded-xl border-2 border-dashed border-violet-200 dark:border-violet-600 bg-violet-50/60 dark:bg-violet-900/40 p-4 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </div>
        {mode === 'pay' ? (
          <>
            <h4 className="mt-3 font-semibold text-gray-900 dark:text-white text-sm">Chat locked</h4>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Pay into escrow to unlock full chat with {otherName}. Your money is held safely by Dealmint until the work is done.
            </p>
          </>
        ) : (
          <>
            <h4 className="mt-3 font-semibold text-gray-900 dark:text-white text-sm">Chat locked — escrow first</h4>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {otherName} can unlock this chat by placing an order — their payment sits safely in escrow. You can also waive this and reply directly.
            </p>
          </>
        )}

        <div className="mt-3 rounded-lg bg-white dark:bg-violet-800 border border-violet-100 dark:border-violet-700 p-2.5 text-left min-w-0">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Listing</p>
          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{listingTitle}</p>
        </div>

        {mode === 'pay' ? (
          canAfford ? (
            <Button
              onClick={onUnlock}
              className="w-full mt-3 h-11 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium"
            >
              <Lock className="w-4 h-4 mr-2" />
              Pay {formatPrice(price)} to unlock chat
            </Button>
          ) : (
            <Button
              onClick={onAddFunds}
              className="w-full mt-3 h-11 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium"
            >
              Add {formatPrice(shortfall)} to your wallet
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <Button onClick={onWaive} variant="outline" className="w-full h-11 rounded-full dark:border-violet-600 dark:text-white">
              Reply anyway
            </Button>
            {listingId && (
              <Link to={`/listing/${listingId}`} className="block">
                <Button variant="ghost" className="w-full h-9 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                  <Eye className="w-4 h-4 mr-2" />
                  View listing
                </Button>
              </Link>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-green-500" aria-hidden="true" />
            Escrow protected
          </span>
          <span className="flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-green-500" aria-hidden="true" />
            Refundable
          </span>
        </div>
      </div>
    </div>
  );
}
