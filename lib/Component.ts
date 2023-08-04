import { forgetSymbol, rememberSymbol, type RememberedArg } from './remember';
import type { AnyObject, KeysOfType } from './types';

export type DataSources<Fields> = {
  [key in keyof Fields]: () => Fields[key] | undefined;
};

export type Updaters<Fields> = Map<keyof Fields, (oldValue?: any) => any>;

/**
 * Component class. Extends this class to create
 * a new component.
 * @class Component
 * @abstract
 * @example
 * ```ts
 * // Reactive text component. Whenever the text field
 * // is updated through a remembered object, the inner
 * // text of the span element will be updated.
 *
 * interface MyTextComponentFields {
 *   text: string;
 * }
 *
 * class MyTextComponent extends Component<MyTextComponentFields, 'span'> {
 *   public constructor(
 *     dataSources: DataSources<MyTextComponentFields>,
 *     remembered: RememberedArg<MyTextComponentFields>)
 *   ) {
 *     super(dataSources, 'span', remembered);
 *     super.setInnerText('text')
 *   }
 * }
 *
 * // Instantiate, mount & change text
 * const counter = remember({ value: 0 });
 *
 * const textUI = new MyTextComponent(
 *   { text: () => `Counter: ${counter.value}` },
 *   []
 * );
 *
 * setInterval(() => counter.value++, 100);
 *
 * document.body.appendChild(textUI.root);
 * ```
 */
export abstract class Component<
  Fields extends AnyObject,
  RootElementTag extends keyof HTMLElementTagNameMap,
> {
  /** Object containing the data source functions for the component fields */
  public dataSources: DataSources<Fields>;
  /** Map containing the updater functions for the component fields */
  public updaters: Updaters<Fields>;
  /** The `HTMLElement` object for this component root element */
  public root: HTMLElementTagNameMap[RootElementTag];
  /** Information regarding the associated remembered objects */
  public remembered: RememberedArg<Fields>;

  /**
   * Instantiate a new component
   * @param dataSources Data sources object for the component fields
   * @param rootTag The HTML tag for the root element
   * @param remembered Object containing information regarding the associated remembered objects
   * @constructor
   */
  public constructor(
    dataSources: DataSources<Fields>,
    rootTag: RootElementTag,
    remembered: RememberedArg<Fields>,
  ) {
    this.dataSources = dataSources;
    this.updaters = new Map();
    this.remembered = remembered;

    // Can be overridden by subclasses
    this.root = document.createElement(rootTag);

    for (const remembered of this.remembered) {
      remembered['_#remember'][rememberSymbol](this, this.remembered);
    }
  }

  /**
   * Registers an updater function for the given field.
   * Whenever the field is updated (using the remember object)
   * the inner text of the given element will be updated to the
   * value of the field.
   * @param fieldName The name of the field to update
   * @param element The element to update (root element by default)
   */
  public setInnerText(
    fieldName: KeysOfType<Fields, string>,
    element: HTMLElement = this.root,
  ) {
    const updater = () => {
      const dataSource = this.dataSources[fieldName];
      if (!dataSource) return;

      element.innerText = dataSource() as string;
    };

    updater();

    this.updaters.set(fieldName, updater);
  }

  /**
   * Registers an updater function for the given field.
   * Whenever the field is updated (using the remember object)
   * the given attribute of the given element will be updated to the
   * value of the field.
   * @param attributeName The name of the attribute to update
   * @param fieldName The name of the field to update
   * @param element The element to update (root element by default)
   */
  public setAttribute(
    attributeName: string,
    fieldName: KeysOfType<Fields, string>,
    element: HTMLElement = this.root,
  ) {
    const updater = () => {
      const dataSource = this.dataSources[fieldName];
      if (!dataSource) return;

      const data = dataSource() as string;

      if (data !== null && data !== undefined)
        element.setAttribute(attributeName, data);
      else element.removeAttribute(attributeName);
    };

    updater();

    this.updaters.set(fieldName, updater);
  }

  /**
   * Registers an updater function for the given field.
   * Whenever the field is updated (using the remember object)
   * the given css property of the given element will be updated
   * to the value of the field.
   * @param style The name of the style to update
   * @param fieldName The name of the field to update
   * @param element The element to update (root element by default)
   */
  public setCSSStyle(
    style: keyof CSSStyleDeclaration,
    fieldName: keyof Fields,
    element: HTMLElement = this.root,
  ) {
    const updater = () => {
      const dataSource = this.dataSources[fieldName];
      if (!dataSource) return;

      const data = dataSource();

      // @ts-ignore
      if (data !== null && data !== undefined) element.style[style] = data;
      // @ts-ignore
      else element.style[style] = '';
    };

    updater();

    this.updaters.set(fieldName, updater);
  }

  /**
   * Destroys the component, clearing all updaters,
   * data sources and forgetting all remembered objects.
   * Also destroys the root element.
   *
   * This method can be overridden by subclasses but
   * should always call `super.destroy()` as it
   * is responsible for clearing the updaters, the
   * data sources and removing the root element.
   */
  public destroy() {
    this.root.remove();

    this.updaters.clear();
    Object.assign(this.dataSources, {});

    for (const remembered of this.remembered) {
      const rememberObject = remembered['_#remember'];
      rememberObject[forgetSymbol](this);
    }

    // Everything is cleared and dereferenced
    // so the garbage collector can do its job
  }
}
