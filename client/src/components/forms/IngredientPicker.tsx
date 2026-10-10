import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Checkbox } from '@/components/ui/checkbox';
import type { Ingredient } from '@shared/schema';

type Props = { value?: number[]; onChange: (ids: number[]) => void };

/** Ingredients in label order: the order you tick them is the order printed. */
export default function IngredientPicker({ value = [], onChange }: Props) {
  const { data: ingredients = [], isLoading } = useQuery<Ingredient[]>({ queryKey: ['/api/ingredients'] });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading ingredients…</p>;
  if (!ingredients.length)
    return (
      <p className="text-sm text-muted-foreground">
        No ingredients yet.{' '}
        <Link href="/ingredients/create" className="text-primary underline underline-offset-4">
          Add your first ingredient
        </Link>{' '}
        and it will show up here.
      </p>
    );

  const toggle = (id: number, on: boolean) => onChange(on ? [...value, id] : value.filter((v) => v !== id));

  return (
    <fieldset>
      <legend className="sr-only">Ingredients</legend>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {ingredients.map((ing) => {
          const position = value.indexOf(ing.id) + 1;
          return (
            <li key={ing.id}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-muted">
                <Checkbox checked={position > 0} onCheckedChange={(on) => toggle(ing.id, on === true)} />
                <span className="flex-1 text-sm">
                  {ing.name}
                  {ing.eNumber && <span className="text-muted-foreground"> ({ing.eNumber})</span>}
                  {!!ing.allergens?.length && (
                    <span className="ml-2 text-xs font-semibold text-primary">Allergen</span>
                  )}
                </span>
                {position > 0 && (
                  <span className="text-xs tabular-nums text-muted-foreground" aria-label={`Position ${position}`}>
                    {position}
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
