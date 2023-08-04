import type { RememberedArg } from './remember';
import type { AnyObject, KeysOfType } from './types';

/**
 * Utility type to get the matching fields between two objects.
 */
type MatchingFields<
  SourceComponentFields extends AnyObject,
  TargetComponentFields extends AnyObject,
> = {
  [SourceField in keyof SourceComponentFields]: {
    source: SourceField;
    target: KeysOfType<
      TargetComponentFields,
      SourceComponentFields[SourceField]
    >;
  };
}[keyof SourceComponentFields];

/**
 * Delegates the given fields from the given remembered argument
 * to a new remembered argument. This function doesn't create
 * new remembered object and only delegates the given fields which
 * results in better performance (instead of wrapping a remembered
 * field into a new remembered object).
 * @param rememberedArg Remembered object to delegate from
 * @param fields Fields to delegate
 * @returns A new remembered object with the delegated fields
 * @example
 * ```ts
 * const person = remember({ name: 'John', age: 20 });
 * const personUI = new Person(
 *   {
 *     name: () => person.name,
 *     age: () => person.age,
 *   },
 *   [{
 *     '_#remember': person,
 *     name: ['name'],
 *     age: ['age'],
 *   }]
 * );
 *
 * // Consider that the Person component displays the name in a Text component
 * // In the Person component:
 * const nameUI = new Text(
 *   {
 *     text: this.dataSources.get('name')
 *   },
 *   delegate(rememberedArg, [{ source: 'name', target: 'text'}])
 * )
 * ```
 */
export function delegate<
  SourceComponentFields extends AnyObject,
  TargetComponentFields extends AnyObject,
>(
  rememberedArg: RememberedArg<SourceComponentFields>,
  fields: MatchingFields<SourceComponentFields, TargetComponentFields>[],
): RememberedArg<TargetComponentFields> {
  // @ts-ignore as we dynamically add the fields to the remembered object
  return rememberedArg
    .filter((remembered) => fields.some((field) => field.source in remembered))
    .map((remembered) => {
      const newRemembered = {
        '_#remember': remembered['_#remember'],
      };

      for (const field of fields) {
        // @ts-expect-error Target field type is not known @ runtime
        newRemembered[field.target] = remembered[field.source];
      }

      return newRemembered;
    });
}
