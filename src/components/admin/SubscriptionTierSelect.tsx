import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';

interface SubscriptionTier {
  tier_name: string;
  display_name_ar: string;
}

interface SubscriptionTierSelectProps {
  value: string;
  onChange: (tier: string) => void;
}

export function SubscriptionTierSelect({ value, onChange }: SubscriptionTierSelectProps) {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);

  useEffect(() => {
    api.get<{ tiers: SubscriptionTier[] }>('/subscription/tiers').then((res) => {
      setTiers(res.tiers ?? []);
    }).catch(() => {
      // silently fail — select will just show empty
    });
  }, []);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="اختر الباقة" />
      </SelectTrigger>
      <SelectContent>
        {tiers.map((tier) => (
          <SelectItem key={tier.tier_name} value={tier.tier_name}>
            {tier.display_name_ar}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
