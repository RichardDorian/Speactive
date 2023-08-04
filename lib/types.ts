/** A record that represents any object */
export type AnyObject = Record<PropertyKey, any>;

/**
 * Utility type that returns all the keys of the
 * given type that are of the given type.
 */
export type KeysOfType<TObj extends AnyObject, TType> = {
  [Key in keyof TObj]: TObj[Key] extends TType ? Key : never;
}[keyof TObj];

/**
 * Utility type that makes all fields in the
 * given type optional, including fields of
 * children objects.
 */
export type AllOptional<TObj extends AnyObject> = TObj extends object
  ? { [Key in keyof TObj]?: AllOptional<TObj[Key]> }
  : TObj;
