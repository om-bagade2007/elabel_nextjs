import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import WineLabel, { useDppBase } from '@/components/label/WineLabel';
import type { ProductWithIngredients } from '@shared/schema';

const SAMPLE = {
  id: 0,
  name: 'Clos des Vignes Rouge',
  brand: 'Domaine Laurent',
  appellation: 'Bordeaux AOC',
  vintage: '2022',
  netVolume: '750 ml',
  alcoholContent: '13.5',
  kj: '347',
  kcal: '83',
  operatorType: 'Producer and Bottler',
  operatorName: 'Domaine Laurent SARL',
  operatorAddress: '12 Chemin des Vignes, 33000 Bordeaux',
  countryOfOrigin: 'France',
  pregnancyWarning: true,
  ageWarning: true,
  drivingWarning: true,
  ingredients: [
    { id: 1, name: 'Grapes', eNumber: null, allergens: [], category: null },
    { id: 2, name: 'Tartaric acid', eNumber: 'E334', allergens: [], category: null },
    { id: 3, name: 'Sulphites', eNumber: 'E220', allergens: ['Sulphites'], category: null },
  ],
} as unknown as ProductWithIngredients;

const STEPS = [
  ['Enter the wine once', 'Ingredients, nutrition, producer and certifications in one form.'],
  ['Print the label', 'A 100 × 120 mm SVG back label with the passport QR code in a fixed place.'],
  ['Shoppers scan', 'The QR opens a mobile page with everything the EU asks you to disclose.'],
];

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const dppBase = useDppBase();

  return (
    <main className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:gap-20 lg:px-8 lg:py-20">
      <div className="max-w-xl">
        <h1 className="text-5xl leading-[1.05] sm:text-6xl">Wine labels with a digital product passport behind them.</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Open E-Label prints the back label, generates its QR code and publishes the ingredients,
          nutrition and producer details shoppers see when they scan.
        </p>
        <Button size="lg" className="mt-8 min-h-12 px-6 text-base" onClick={() => setLocation(isAuthenticated ? '/products' : '/login')}>
          {isAuthenticated ? 'Go to products' : 'Log in to the dashboard'}
        </Button>

        <ol className="mt-12 space-y-5 border-t pt-8">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="grid grid-cols-[2rem_1fr] gap-x-3">
              <span className="font-display text-xl text-primary">{i + 1}</span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <figure className="mx-auto w-full max-w-[360px]">
        <WineLabel
          product={SAMPLE}
          qrUrl={`${dppBase}/`}
          className="h-auto w-full -rotate-1 shadow-[0_2px_4px_hsl(var(--foreground)/0.08),0_12px_32px_hsl(var(--foreground)/0.12)]"
        />
        <figcaption className="mt-4 text-center text-sm text-muted-foreground">
          A sample back label, generated from the product form.
        </figcaption>
      </figure>
    </main>
  );
}
