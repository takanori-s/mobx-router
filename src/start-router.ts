// @ts-ignore
import { Router } from 'director/build/director';

import { autorun } from 'mobx';

import { viewsForDirector, DirectorConfig } from './utils';
import { RoutesConfig } from './route';
import { Store } from './router-store';


const createDirectorRouter = <T extends Store>(views: RoutesConfig<T>, store: T, config: DirectorConfig = {}) => {
    new Router({
        ...viewsForDirector(views, store, config)
    })
        .configure(config)
        // set fallback to /#/ only when hash routing
        .init(config.html5history === false ? '/' : undefined);
};

export const startRouter = <T extends Store>(
    routes: RoutesConfig<T>,
    store: T,
    config: DirectorConfig = {},
) => {
    //create director configuration
    const defaultDirectorConfig = {
        html5history: true,
    };

    const directorConfig = Object.assign(defaultDirectorConfig, config);
    createDirectorRouter<T>(routes, store, directorConfig);

    //autorun and watch for path changes
    autorun(() => {
        const { currentPath } = store.router;
        if (currentPath) {
            if (directorConfig.html5history) {
                if (currentPath !== (window.location.pathname + window.location.search)) {
                    window.history.pushState(null, null || "", currentPath);
                }
            } else {
                const hash = `#${currentPath}`;
                if (hash !== window.location.hash) {
                    window.history.pushState(null, null || "", `/${hash}`);
                }
            }
        }
    });

    if (!config.html5history) {
        // catch up the case, in which user input a path in browser URL bar
        // but currentPath was not changed and currentPath is inconsistent with browser URL bar
        // (such as the case beforeEnter returned false, or routed to same route as current)
        window.addEventListener('hashchange', () => {
            const { currentPath } = store.router;
            if (currentPath) {
                const hash = `#${currentPath}`;
                if (hash !== window.location.hash) {
                    window.history.replaceState(null, null || "", `/${hash}`);
                }
            }
        })
    }
};
