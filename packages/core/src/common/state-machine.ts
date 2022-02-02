/********************************************************************************
 * Copyright (C) 2022 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

/**
 * Given a map of states and a list of reachable states, a `StateMachine` object
 * will ensure that a state change respects the allowed transitions.
 *
 * ```ts
 * const sm = new StateMachine<'a' | 'b' | 'c'>({
 *     'a': ['b'],
 *     'b': ['c'],
 *     'c': ['a']
 * }, 'a');
 *
 * sm.state = 'b' // OK: state is now 'b'
 * sm.state = 'a' // Error: invalid state transition (b -> a)
 * ```
 */
export class StateMachine<T extends string | number | symbol> {
    protected _state: T;
    protected _transitions = new Map<T, Set<T>>();

    constructor(definition: Record<T, T[]>, initial: T) {
        this._state = initial;
        for (const [state, transitions] of Object.entries(definition)) {
            this._transitions.set(state as T, new Set(transitions as T[]));
        }
    }

    get state(): T {
        return this._state;
    }

    set state(value) {
        if (!this.setState(value)) {
            throw new Error(`invalid state transition (${this.state} -> ${value})`);
        }
    }

    setState(newState: T): boolean {
        if (this._transitions.get(this._state)?.has(newState)) {
            this._state = newState;
            return true;
        } else {
            return false;
        }
    }
}
