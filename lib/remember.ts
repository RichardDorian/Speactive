import type { Component } from './Component';
import type { AnyObject } from './types';

/** Symbol used internally by the framework */
export const rememberSymbol: unique symbol = Symbol.for('remember');
/** Symbol used internally by the framework */
export const forgetSymbol: unique symbol = Symbol.for('forget');

export type Remembered<T extends AnyObject> = T & {
  [rememberSymbol]: (
    component: Component<any, any>,
    remembered: RememberedArg<T>,
  ) => void;
  [forgetSymbol]: (component: Component<any, any>) => void;
};

export type RememberedData<Fields> = {
  [key in keyof Fields]?: string[];
};
export type RememberedArg<Fields> = ({
  '_#remember': Remembered<{}>; // TODO: Refactor to use a symbol instead of '_#remember'
} & RememberedData<Fields>)[];

/**
 * Creates a remember object from the given data. This object
 * will call the associated component updaters whenever a field
 * is updated.
 * @param initialData The data to remember
 * @returns A remember object with the initial data inside
 */
export function remember<T extends AnyObject>(initialData: T): Remembered<T> {
  const subscribers = new Map<Component<any, any>, RememberedArg<T>>();

  console.log('Hello World!');

  return new Proxy(initialData, {
    set(target, p, newValue) {
      const oldValue = Reflect.get(target, p, target);
      const returnValue = Reflect.set(target, p, newValue, target);

      for (const subscriber of subscribers) {
        const fieldsToUpdate: string[] = [];
        for (const field in subscriber[1]) {
          if (field === '_#remember') continue;
          // @ts-ignore
          if (subscriber[1][field]?.includes(p)) fieldsToUpdate.push(field);
        }

        for (const field of fieldsToUpdate) {
          subscriber[0].updaters.get(field)?.(oldValue);
        }
      }

      return returnValue;
    },
    get(target, p, receiver) {
      if (p === rememberSymbol)
        return (
          component: Component<any, any>,
          remembered: RememberedArg<T>,
        ) => {
          subscribers.set(component, remembered);
        };
      if (p === forgetSymbol)
        return (component: Component<any, any>) => {
          subscribers.delete(component);
        };

      return Reflect.get(target, p, receiver);
    },
  }) as Remembered<T>;
}
