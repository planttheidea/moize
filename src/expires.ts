import { Cache, Key } from 'micro-memoize';
import {
    GetMaxAge,
    Moizable,
    Moized,
    Options,
    ShouldPersist,
    ShouldRemoveOnExpire,
} from './internalTypes';

export class ExpirationManager<Fn extends Moizable> {
    c: Cache<Fn>;
    e = new Map<Key, ReturnType<typeof setTimeout>>();
    l = 0;
    p: ShouldPersist<Fn> | undefined;
    r: ShouldRemoveOnExpire<Fn> | undefined;
    t: number | GetMaxAge<Fn>;
    u: boolean;

    constructor(cache: Cache<Fn>, expires: Required<Options<Fn>>['expires']) {
        this.c = cache;

        if (typeof expires === 'object') {
            this.t = expires.after;
            this.p = expires.shouldPersist;
            this.r = expires.shouldRemove;
            this.u = Boolean(expires.update);
        } else {
            this.t = expires;
            this.u = false;
        }

        this.c.on('add', (event) => {
            const node = this.c.g(event.key);

            if (node && !this.p?.(event.key, event.value, cache)) {
                this.s(event.key, event.value);
            }
        });

        if (this.u) {
            this.c.on('hit', (event) => {
                const node = this.c.g(event.key);

                if (node) {
                    this.s(event.key, event.value);
                }
            });
        }

        this.c.on('delete', (event) => {
            const node = this.c.g(event.key);

            if (node && this.e.has(event.key)) {
                this.d(event.key);
            }
        });
    }

    d(key: Key) {
        const expiration = this.e.get(key);

        if (!expiration) {
            return;
        }

        clearTimeout(expiration);
        this.e.delete(key);
    }

    s(key: Key, value: ReturnType<Fn>) {
        if (this.e.has(key)) {
            this.d(key);
        }

        const cache = this.c;
        const time =
            typeof this.t === 'function' ? this.t(key, value, cache) : this.t;

        if (!isExpireTimeValid(time)) {
            throw new TypeError(
                'The expiration time must be a finite, non-negative number.',
            );
        }

        const timeout = setTimeout(() => {
            this.d(key);

            const node = cache.g(key);

            if (!node) {
                return;
            }

            if (
                typeof this.r === 'function' &&
                !this.r(key, node.v, time, cache)
            ) {
                cache.u(node);
                cache.o && cache.o.n('update', node, 'refreshed');

                this.s(key, node.v);
            } else {
                cache.d(node);
                cache.o && cache.o.n('delete', node, 'expired');
            }
        }, time);

        this.e.set(key, timeout);
    }
}

export function getExpirationManager<
    Fn extends Moizable,
    Opts extends Options<Fn>,
>(moized: Moized<Fn, Opts>, options: Opts) {
    return options.expires != null
        ? new ExpirationManager(moized.cache, options.expires)
        : undefined;
}

function isExpireTimeValid(expires: any): expires is number {
    return (
        typeof expires === 'number' && expires >= 0 && Number.isFinite(expires)
    );
}
