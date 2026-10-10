import { apiRequest } from '@/lib/queryClient';
import type { ProductWithIngredients } from '@shared/schema';
import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { formatAbv, PACKAGING_GASES } from '@/components/label/WineLabel';

// Arrived by scanning the printed QR: log the scan with the location, if the shopper allows it.
function useLogScan(productId: number) {
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('src') || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        void fetch('/api/public/scans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, lat: coords.latitude, lng: coords.longitude, source: 'qr' }),
        }).catch(() => {}),
      () => {},
      { timeout: 10000, maximumAge: 600000 },
    );
  }, [productId]);
}

const Row = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <tr className="border-t">
      <th scope="row" className="py-2.5 pr-4 text-left font-normal text-muted-foreground">
        {label}
      </th>
      <td className="py-2.5 text-right font-medium">{value}</td>
    </tr>
  ) : null;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t px-5 py-6 sm:px-8">
    <h2 className="mb-3 text-lg font-semibold">{title}</h2>
    {children}
  </section>
);

const PublicProductPage = () => {
  const params = useParams();
  const id = params?.id ? Number.parseInt(params.id, 10) : Number.NaN;
  const [product, setProduct] = useState<ProductWithIngredients | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  useLogScan(id);

  useEffect(() => {
    let cancelled = false;
    if (!Number.isInteger(id) || id < 1) {
      setLoadError('This QR code does not point to a product.');
      return;
    }
    apiRequest(`/api/public/products/${id}`)
      .then((res) => {
        if (cancelled) return;
        const p = res.data || res;
        if (p.redirectLink) window.location.replace(p.redirectLink);
        else setProduct(p);
      })
      .catch(
        () =>
          !cancelled &&
          setLoadError('This product could not be loaded. Check your connection and scan again.'),
      );
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loadError || !product) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center text-muted-foreground">
        <p role={loadError ? 'alert' : 'status'}>{loadError || 'Loading product…'}</p>
      </main>
    );
  }

  const p = product;
  const ingredients = p.ingredients || [];
  const allergens = Array.from(new Set(ingredients.flatMap((i) => i.allergens || [])));
  const energy = [p.kj && `${p.kj} kJ`, p.kcal && `${p.kcal} kcal`].filter(Boolean).join(' / ');
  const certifications = [p.organic && 'Organic', p.vegetarian && 'Vegetarian', p.vegan && 'Vegan'].filter(
    Boolean,
  ) as string[];
  const warnings = [
    p.pregnancyWarning && { src: '/pregnancy.svg', text: 'Not for pregnant women' },
    p.ageWarning && { src: '/below18.svg', text: 'Not for persons under 18' },
    p.drivingWarning && { src: '/nocar.svg', text: 'Do not drink and drive' },
  ].filter(Boolean) as { src: string; text: string }[];
  const lat = p.latitude || p.manufacturingLatitude;
  const lng = p.longitude || p.manufacturingLongitude;
  const keyFacts = [
    ['Volume', p.netVolume],
    ['Alcohol', formatAbv(p.alcoholContent)],
    ['Vintage', p.vintage],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-card sm:my-8 sm:min-h-0 sm:rounded-[10px] sm:border">
      <header className="px-5 pb-6 pt-8 sm:px-8">
        <p className="text-sm text-muted-foreground">
          Digital product passport <span className="text-foreground">DPP-{p.id}</span>
          {p.ean && <>, EAN {p.ean}</>}
        </p>
        {p.brand && <p className="mt-4 text-muted-foreground">{p.brand}</p>}
        <h1 className="mt-1 text-4xl leading-tight sm:text-5xl">{p.name}</h1>
        {(p.wineType || p.appellation) && (
          <p className="mt-2 text-muted-foreground">
            {[p.wineType, p.appellation].filter(Boolean).join(', ')}
          </p>
        )}
        {keyFacts.length > 0 && (
          <dl className="mt-6 grid grid-cols-3 gap-3">
            {keyFacts.map(([label, value]) => (
              <div key={label} className="rounded-md bg-muted px-3 py-2.5">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      {p.imageUrl && (
        <div className="flex h-72 items-center justify-center bg-muted p-4">
          <img src={p.imageUrl} alt={p.name} className="block max-h-full max-w-full object-contain" />
        </div>
      )}

      {ingredients.length > 0 && (
        <Section title="Ingredients">
          <p className="leading-relaxed">
            {ingredients.map((ing, i) => (
              <span key={ing.id} className={ing.allergens?.length ? 'font-bold' : undefined}>
                {ing.name}
                {ing.eNumber && ` (${ing.eNumber})`}
                {i < ingredients.length - 1 ? ', ' : '.'}
              </span>
            ))}
          </p>
          {allergens.length > 0 && (
            <p className="mt-3 rounded-md border-l-4 border-primary bg-primary/5 px-3 py-2 text-sm">
              <span className="font-semibold">Contains:</span> {allergens.join(', ')}
            </p>
          )}
          {p.packagingGases && PACKAGING_GASES[p.packagingGases] && (
            <p className="mt-3 text-sm text-muted-foreground">{PACKAGING_GASES[p.packagingGases]}</p>
          )}
        </Section>
      )}

      {(energy || p.fat || p.carbohydrates) && (
        <Section title="Nutrition declaration">
          <table className="w-full text-sm">
            <caption className="mb-2 text-left text-muted-foreground">Average values per 100 ml</caption>
            <tbody>
              <Row label="Energy" value={energy} />
              <Row label="Fat" value={p.fat} />
              <Row label="of which saturates" value={p.saturates} />
              <Row label="Carbohydrates" value={p.carbohydrates} />
              <Row label="of which sugars" value={p.sugar} />
              <Row label="Protein" value={p.protein} />
              <Row label="Salt" value={p.salt} />
            </tbody>
          </table>
          {p.portionSize && <p className="mt-3 text-sm text-muted-foreground">Portion: {p.portionSize}</p>}
        </Section>
      )}

      {warnings.length > 0 && (
        <Section title="Responsible consumption">
          <ul className="space-y-3">
            {warnings.map((w) => (
              <li key={w.src} className="flex items-center gap-3">
                <img src={w.src} alt="" className="h-10 w-10" />
                <span>{w.text}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {certifications.length > 0 && (
        <Section title="Certifications">
          <ul className="flex flex-wrap gap-2">
            {certifications.map((c) => (
              <li key={c} className="rounded-md bg-verified/10 px-3 py-1.5 text-sm font-medium text-verified">
                {c}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(p.manufacturingLocation || p.manufacturingAddress || lat) && (
        <Section title="Where it was made">
          <address className="not-italic leading-relaxed">
            {p.manufacturingLocation && <span className="block font-medium">{p.manufacturingLocation}</span>}
            {p.manufacturingAddress && <span className="block">{p.manufacturingAddress}</span>}
            {(p.manufacturingCity || p.manufacturingState || p.manufacturingCountry) && (
              <span className="block">
                {[p.manufacturingCity, p.manufacturingState, p.manufacturingPostalCode, p.manufacturingCountry]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            )}
          </address>
          {lat && lng && (
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
            >
              View on map ({Number(lat).toFixed(4)}, {Number(lng).toFixed(4)})
            </a>
          )}
        </Section>
      )}

      {(p.operatorName || p.operatorAddress || p.countryOfOrigin) && (
        <Section title="Producer">
          <address className="not-italic leading-relaxed">
            {p.operatorType && p.operatorType !== 'None' && (
              <span className="block text-sm text-muted-foreground">{p.operatorType}</span>
            )}
            {p.operatorName && <span className="block font-medium">{p.operatorName}</span>}
            {p.operatorAddress && <span className="block whitespace-pre-line">{p.operatorAddress}</span>}
            {p.countryOfOrigin && <span className="mt-2 block">Product of {p.countryOfOrigin}</span>}
          </address>
          {p.operatorInfo && <p className="mt-3 text-sm text-muted-foreground">{p.operatorInfo}</p>}
        </Section>
      )}

      <footer className="border-t px-5 py-6 text-sm text-muted-foreground sm:px-8">
        Information provided by the producer through Open E-Label.
        {p.sku && <span className="block">SKU {p.sku}</span>}
      </footer>
    </main>
  );
};

export default PublicProductPage;
