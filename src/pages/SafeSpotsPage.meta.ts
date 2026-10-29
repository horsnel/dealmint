import { BookOpen, Landmark, ShieldCheck, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import type { SafeSpotType } from '@/types';

export const spotTypeMeta: { value: SafeSpotType; label: string; icon: typeof ShieldCheck }[] = [
  { value: 'police_station', label: 'Police station', icon: ShieldCheck },
  { value: 'mall', label: 'Shopping mall', icon: ShoppingBag },
  { value: 'bank', label: 'Bank', icon: Landmark },
  { value: 'restaurant', label: 'Restaurant / cafe', icon: UtensilsCrossed },
  { value: 'library', label: 'Library', icon: BookOpen },
];

export const spotCities = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Benin City', 'Kano'];
