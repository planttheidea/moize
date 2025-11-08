import type { Cache, Key } from 'micro-memoize';
import type {
    GetExpires,
    Moizeable,
    Moized,
    Options,
    ShouldPersist,
    ShouldRemoveOnExpire,
} from './internalTypes';

export class ExpirationManager<Fn extends Moizeable> {
    /**
     * The [c]ache being monitored.
     */
    c: Cache<Fn>;
    /**
     * Map of [e]xpiration timeouts.
     */
    e = new Map<Key, ReturnType<typeof setTimeout>>();
    /**
     * Whether the entry in cache should [p]ersist, and therefore not
     * have any expiration.
     */
    p: ShouldPersist<Fn> | undefined;
    /**
     * Whether the entry in cache should be [r]emoved on expiration.
     */
    r: ShouldRemoveOnExpire<Fn> | undefined;
    /**
     * The [t]ime to wait before expiring, or a method that determines that time.
     */
    t: number | GetExpires<Fn>;
    /**
     * Whether the expiration should [u]pdate when the cache entry is hit.
     */
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
            if (
                this.c.g(event.key) &&
                !this.p?.(event.key, event.value, cache)
            ) {
                this.s(event.key, event.value);
            }
        });

        // Only set up a `hit` listener if we care about updating the expiration.
        if (this.u) {
            this.c.on('hit', (event) => {
                if (
                    this.c.g(event.key) &&
                    !this.p?.(event.key, event.value, cache)
                ) {
                    this.s(event.key, event.value);
                }
            });
        }

        this.c.on('delete', (event) => {
            if (this.e.has(event.key)) {
                this.d(event.key);
            }
        });
    }

    /**
     * Method to [d]elete the expiration.
     */
    d(key: Key) {
        const expiration = this.e.get(key);

        if (!expiration) {
            return;
        }

        clearTimeout(expiration);
        this.e.delete(key);
    }

    /**
     * Method to [s]et the new expiration. If one is present for the given `key`, it will delete
     * the existing expiration before creating the new one.
     */
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
                node !== cache.h && cache.u(node);
                cache.o && cache.o.n('update', node, 'expiration reset');

                this.s(key, node.v);
            } else {
                cache.d(node);
                cache.o && cache.o.n('delete', node, 'expired');
            }
        }, time);

        // @ts-expect-error - If done in NodeJS, the timeout should have its reference removed to avoid
        // hanging timers if collected while running.
        timeout.unref?.();

        this.e.set(key, timeout);
    }
}

export function getExpirationManager<
    Fn extends Moizeable,
    Opts extends Options<Fn>,
>(moized: Moized<Fn, Opts>, options: Opts): ExpirationManager<Fn> | undefined {
    if (options.expires != null) {
        return new ExpirationManager(moized.cache, options.expires);
    }
}

function isExpireTimeValid(expires: any): expires is number {
    return (
        typeof expires === 'number' && expires >= 0 && Number.isFinite(expires)
    );
}
