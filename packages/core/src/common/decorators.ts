// *****************************************************************************
// Copyright (C) 2022 Ericsson and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
// *****************************************************************************

/**
 * Class decorator to type a class static fields according to {@link T}.
 */
export function classImplements<T>(): <U extends T>(target: U) => void {
    // Actually do nothing, we only care about typings here
    return () => { };
}

export interface ConcurrencyLockOptions {
    /**
     * Warn if `decorated.constructor.name !== 'AsyncFunction`.
     *
     * @default true
     */
    warnIfNotAsync?: boolean
}

/**
 * Decorated methods will only run at most once per instance concurrently.
 *
 * @example
 *
 * const a = instance.concurrencyLocked();
 * const b = instance.concurrencyLocked();
 * const c = instance.concurrencyLocked();
 *
 * a !== b;
 * a !== c;
 * b === c;
 *
 * // `a` resolves so the call shared by `b` and `c` begins...
 *
 * const d = instance.concurrencyLocked();
 * const e = instance.concurrencyLocked();
 *
 * c !== d;
 * c !== e;
 * d === e;
 */
export function ConcurrencyLock(options?: ConcurrencyLockOptions): MethodDecorator {
    return (target, propertyKey, descriptor) => {
        if (typeof descriptor.value !== 'function') {
            throw new TypeError('can only decorate methods');
        }
        if (options?.warnIfNotAsync !== false && descriptor.value.constructor.name !== 'AsyncFunction') {
            console.warn(`@ConcurrencyLock(): ${target.constructor.name}.${propertyKey.toString()} is not an AsyncFunction!`);
        }
        interface ConcurrencyLockState {
            current?: Promise<unknown>
            next?: Promise<unknown>
        }
        const wrapped = descriptor.value;
        const instanceToState = new WeakMap<object, ConcurrencyLockState>();
        (descriptor.value as Function) = async function ConcurrencyLockWrapper(this: object, ...args: unknown[]): Promise<unknown> {
            let state = instanceToState.get(this);
            if (!state) {
                instanceToState.set(this, state = {});
            }
            let result;
            if (state.next) {
                // return queued next call
                result = state.next;
            } else if (state.current) {
                // queue and return next call
                result = state.next = state.current.then(
                    () => wrapped.apply(this, args),
                    () => wrapped.apply(this, args)
                );
            } else {
                // return and wait for current call
                result = state.current = Promise.resolve(wrapped.apply(this, args))
                    .finally(() => {
                        state!.current = state!.next;
                        state!.next = undefined;
                    });
            }
            return result;
        };
    };
}
