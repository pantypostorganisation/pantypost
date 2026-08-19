// src/components/icons/MoneyBillWave.tsx
//
// The ONE sanctioned doorway for a non-lucide icon.
//
// The design rule is lucide-react only, and it exists for the same
// reason the palette has exactly three oranges: ad-hoc imports from
// other icon sets is how visual drift starts. But lucide has no wavy
// banknote, and this shape was wanted for the hero payments counter --
// so the exception is contained here instead of scattered through
// components. If another outside icon is ever truly needed, it gets a
// wrapper in THIS folder; components never import 'react-icons/*'
// directly.
//
// Pair it with solid-filled lucide icons (fill="currentColor"), never
// with 2px outlines -- a filled glyph next to a stroked one is the
// weight mismatch that started the whole hero-icon saga.

'use client';

import { LiaMoneyBillWaveAltSolid } from 'react-icons/lia';

export default function MoneyBillWave(props: React.ComponentProps<typeof LiaMoneyBillWaveAltSolid>) {
  return <LiaMoneyBillWaveAltSolid aria-hidden="true" {...props} />;
}
