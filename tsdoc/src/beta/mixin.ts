/**
 * This abstraction is used by the mixin pattern.
 * It describes a class constructor.
 * @public
 */
export type Constructor<T = {}> = new (...args: any[]) => T; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * This abstraction is used by the mixin pattern.
 * It describes an abstract class constructor.
 * @public
 */
export type AbstractConstructor<T = {}> = Function & { prototype: T };

/**
 * This abstraction is used by the mixin pattern.
 * It describes either an abstract or a non-abstract class constructor.
 * @public
 */
export type ConstructorLike<T = {}> =
    | Constructor<T>
    | AbstractConstructor<T>
    ;

/**
 * This abstraction is used by the mixin pattern.
 * It describes the "static side" of a class.
 *
 * @public
 */
export type PropertiesOf<T> = Omit<T, "prototype">;

export type InstanceOrPrototypeType<T extends ConstructorLike> =
    T extends Constructor<infer U> ? U :
    T extends AbstractConstructor<infer U> ? U :
    never;

export type MixinBase<TStatic extends ConstructorLike<T> = ConstructorLike, T = InstanceOrPrototypeType<TStatic>> = ConstructorLike<T> & PropertiesOf<TStatic>;
export type MixedConstructor<TBase extends ConstructorLike, TMixin> = TBase & (new (...args: []) => TMixin);

export type Mixin<TBase extends ConstructorLike> = (baseClass: TBase) => TBase & (new (...args: any[]) => any);

export function mixin<TBase extends ConstructorLike, A extends []>(base: TBase, mixins: A): TBase;
export function mixin<TBase extends ConstructorLike, A extends [Mixin<TBase>]>(base: TBase, mixins: A): TBase & ReturnType<A[0]>;
export function mixin<TBase extends ConstructorLike, A extends [Mixin<TBase>, Mixin<TBase>]>(base: TBase, mixins: A): TBase & ReturnType<A[0]> & ReturnType<A[1]>;
export function mixin<TBase extends ConstructorLike, A extends [Mixin<TBase>, Mixin<TBase>, Mixin<TBase>]>(base: TBase, mixins: A): TBase & ReturnType<A[0]> & ReturnType<A[1]> & ReturnType<A[2]>;
export function mixin<TBase extends ConstructorLike, A extends [Mixin<TBase>, Mixin<TBase>, Mixin<TBase>, Mixin<TBase>]>(base: TBase, mixins: A): TBase & ReturnType<A[0]> & ReturnType<A[1]> & ReturnType<A[2]> & ReturnType<A[3]>;
export function mixin<TBase extends ConstructorLike, A extends Mixin<TBase>[]>(base: TBase, mixins: A): TBase {
    return mixins.reduce((mixed: TBase, mixin: Mixin<TBase>) => mixin(mixed), base);
}
