import { forwardRef } from 'react';
import QRCode from 'qrcode';
import { useQuery } from '@tanstack/react-query';
import type { ProductWithIngredients } from '@shared/schema';

// Standard 750 ml Bordeaux back label: 100 x 120 mm (~42% of a 236 mm circumference).
// All coordinates are millimetres. Positions are fixed, so an empty field leaves blank space.
const W = 100;
const H = 120;
const PAD = 6;
const QR = 25; // above the ~20 mm minimum for reliable phone scanning
const INK = '#241A2B';
const MUTED = '#6A6672';
const GRAPE = '#6B1F3A';
const SANS = '"Public Sans", Arial, sans-serif';
const SERIF = 'Gloock, Georgia, serif';

/** "14", "13.5%", "13.5 % vol" -> "14% vol" */
export const formatAbv = (v?: string | null) =>
  v ? `${String(v).replace(/\s*%?\s*(vol\.?)?\s*$/i, '')}% vol` : '';

export const PACKAGING_GASES: Record<string, string> = {
  may_happen: 'Bottling may happen in a protective atmosphere',
  bottled: 'Bottled in a protective atmosphere',
};

const isLocal = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(url);

/** Server's BASE_URL, unless it is a localhost value while the page is served from a real domain. */
export function pickPublicBase(publicUrl: string | undefined, origin: string) {
  const base = publicUrl && !(isLocal(publicUrl) && !isLocal(origin)) ? publicUrl : origin;
  return base.replace(/\/$/, '');
}

/** Public base URL for QR codes, so they work even when the dashboard runs on localhost. */
export function useDppBase() {
  const { data } = useQuery<{ publicUrl?: string }>({ queryKey: ['/api/config'] });
  return pickPublicBase(data?.publicUrl, window.location.origin);
}

/** URL the printed QR code opens: the public DPP page. */
export function useDppUrl(productId?: number) {
  const base = useDppBase();
  return productId ? `${base}/qr/product/${productId}?src=qr` : '';
}

/** High-resolution PNG of the QR code for printers that don't take SVG. */
export async function downloadQrPng(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = await QRCode.toDataURL(url, { width: 1000, margin: 2, errorCorrectionLevel: 'M' });
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** QR code as a single SVG path in module units (size x size). */
export function qrPath(text: string) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
  let d = '';
  for (let r = 0; r < modules.size; r++)
    for (let c = 0; c < modules.size; c++) if (modules.get(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return { size: modules.size, d };
}

type Word = { text: string; bold?: boolean };

// ponytail: wraps by average glyph width (0.52 em), not real font metrics; fine for label copy
function wrap(words: Word[], widthMm: number, fontMm: number, maxLines: number) {
  const maxChars = Math.floor(widthMm / (fontMm * 0.52));
  const lines: Word[][] = [[]];
  let len = 0;
  for (const w of words) {
    if (len + w.text.length > maxChars && len > 0) {
      if (lines.length === maxLines) break;
      lines.push([]);
      len = 0;
    }
    lines[lines.length - 1].push(w);
    len += w.text.length + 1;
  }
  return lines.filter((l) => l.length);
}

const toWords = (s?: string | null): Word[] =>
  (s || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => ({ text }));

function Lines({
  lines,
  x,
  y,
  size,
  lead = 1.3,
  fill = INK,
}: {
  lines: Word[][];
  x: number;
  y: number;
  size: number;
  lead?: number;
  fill?: string;
}) {
  return (
    <text x={x} y={y} fontFamily={SANS} fontSize={size} fill={fill}>
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : size * lead}>
          {line.map((w, j) => (
            <tspan key={j} fontWeight={w.bold ? 700 : 400}>
              {(j ? ' ' : '') + w.text}
            </tspan>
          ))}
        </tspan>
      ))}
    </text>
  );
}

const OPERATOR_LABEL: Record<string, string> = {
  Bottler: 'Bottled by',
  Packager: 'Packed by',
  Producer: 'Produced by',
  Vendor: 'Sold by',
  Importer: 'Imported by',
  'Producer and Bottler': 'Produced and bottled by',
};

type Props = { product: ProductWithIngredients; qrUrl: string; className?: string };

const WineLabel = forwardRef<SVGSVGElement, Props>(({ product: p, qrUrl, className }, ref) => {
  const qr = qrUrl ? qrPath(qrUrl) : null;
  const inner = W - PAD * 2;

  const nameLines = wrap(toWords(p.name), inner, 7, 2);
  const origin = [p.appellation, p.vintage].filter(Boolean).join(', ');

  // Allergens are printed in bold (EU 1169/2011 art. 21)
  const ingredientWords: Word[] = (p.ingredients || []).flatMap((ing, i, all) => {
    const label = ing.eNumber ? `${ing.name} (${ing.eNumber})` : ing.name;
    const bold = !!ing.allergens?.length;
    return toWords(label + (i < all.length - 1 ? ',' : '.')).map((w) => ({ ...w, bold }));
  });
  const ingredientLines = wrap(ingredientWords, inner, 2.8, 5);

  const energy = p.kcal || p.kj ? `Energy per 100 ml: ${[p.kj && `${p.kj} kJ`, p.kcal && `${p.kcal} kcal`].filter(Boolean).join(' / ')}` : '';

  const warnings = [
    p.pregnancyWarning && { href: '/pregnancy.svg', title: 'Not for pregnant women' },
    p.ageWarning && { href: '/below18.svg', title: 'Not for persons under 18' },
    p.drivingWarning && { href: '/nocar.svg', title: 'Do not drink and drive' },
  ].filter(Boolean) as { href: string; title: string }[];

  const operatorWidth = W - PAD * 2 - QR - 4;
  const operatorLines = wrap(
    [
      ...toWords(p.operatorName).map((w) => ({ ...w, bold: true })),
      ...toWords(p.operatorAddress),
    ],
    operatorWidth,
    2.6,
    4,
  );
  const qrY = 80;

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      width={`${W}mm`}
      height={`${H}mm`}
      role="img"
      aria-label={`Wine label for ${p.name}`}
      className={className}
    >
      <rect width={W} height={H} fill="#FFFFFF" />
      <rect x={1.5} y={1.5} width={W - 3} height={H - 3} fill="none" stroke={GRAPE} strokeWidth={0.4} />

      {/* Identity */}
      {p.brand && <Lines lines={[toWords(p.brand)]} x={PAD} y={PAD + 5} size={3.2} fill={MUTED} />}
      <text x={PAD} y={PAD + 13} fontFamily={SERIF} fontSize={7} fill={INK}>
        {nameLines.map((line, i) => (
          <tspan key={i} x={PAD} dy={i === 0 ? 0 : 8}>
            {line.map((w) => w.text).join(' ')}
          </tspan>
        ))}
      </text>
      {origin && <Lines lines={[toWords(origin)]} x={PAD} y={PAD + 13 + nameLines.length * 8 - 1} size={3.4} fill={MUTED} />}
      <line x1={PAD} x2={W - PAD} y1={38} y2={38} stroke={GRAPE} strokeWidth={0.3} />

      {/* Ingredients */}
      {ingredientLines.length > 0 && (
        <>
          <text x={PAD} y={44} fontFamily={SANS} fontSize={3} fontWeight={700} fill={INK}>
            Ingredients
          </text>
          <Lines lines={ingredientLines} x={PAD} y={48.5} size={2.8} />
        </>
      )}

      {/* Nutrition + warnings */}
      {energy && <Lines lines={[toWords(energy)]} x={PAD} y={67} size={2.6} fill={MUTED} />}
      {warnings.map((w, i) => (
        <image key={w.href} href={w.href} x={PAD + i * 9} y={69} width={7.5} height={7.5}>
          <title>{w.title}</title>
        </image>
      ))}

      {/* Operator */}
      {p.operatorType && OPERATOR_LABEL[p.operatorType] && (
        <Lines lines={[toWords(OPERATOR_LABEL[p.operatorType])]} x={PAD} y={qrY + 3} size={2.4} fill={MUTED} />
      )}
      {operatorLines.length > 0 && <Lines lines={operatorLines} x={PAD} y={qrY + 7} size={2.6} />}
      {p.countryOfOrigin && (
        <Lines lines={[toWords(`Product of ${p.countryOfOrigin}`)]} x={PAD} y={qrY + 21} size={2.6} />
      )}

      {/* DPP QR: fixed bottom-right */}
      {qr && (
        <>
          <g transform={`translate(${W - PAD - QR} ${qrY}) scale(${QR / qr.size})`}>
            <path d={qr.d} fill={INK} shapeRendering="crispEdges" />
          </g>
          <text x={W - PAD - QR / 2} y={qrY + QR + 3.5} textAnchor="middle" fontFamily={SANS} fontSize={2.2} fill={MUTED}>
            Scan for full details
          </text>
        </>
      )}

      {/* Mandatory particulars, same visual field */}
      <text x={PAD} y={H - PAD} fontFamily={SANS} fontSize={5} fontWeight={700} fill={INK}>
        {[p.netVolume, formatAbv(p.alcoholContent)]
          .filter(Boolean)
          .join('   ')}
      </text>
    </svg>
  );
});
WineLabel.displayName = 'WineLabel';
export default WineLabel;

/** Save the rendered label as a standalone .svg (pictograms inlined). */
export async function downloadSvg(svg: SVGSVGElement, filename: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute('class');
  for (const img of Array.from(clone.querySelectorAll('image'))) {
    const href = img.getAttribute('href');
    if (!href || href.startsWith('data:')) continue;
    const text = await fetch(href).then((r) => r.text());
    img.setAttribute('href', `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(text)))}`);
  }
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking synchronously can cancel the download in Chromium
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}
