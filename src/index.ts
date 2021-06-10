import type { RegistryValue } from 'registry-js';

export interface WindowsProxySettings {
    proxyUrl: string;
    noProxy: string[];
}

export async function getWindowsSystemProxy(): Promise<WindowsProxySettings | undefined> {
    if (process.platform !== 'win32') {
        throw new Error("Can't detect windows system proxy on non-Windows platform");
    }

    const registry = await import('registry-js');

    const proxyValues = registry.enumerateValues(
        registry.HKEY.HKEY_CURRENT_USER,
        'Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'
    );

    const proxyEnabled = getValue(proxyValues, 'ProxyEnable');
    const proxyServer = getValue(proxyValues, 'ProxyServer');

    // No proxy config? We're done, return undefined.
    if (!proxyEnabled || !proxyEnabled.data || !proxyServer || !proxyServer.data) return undefined;

    // ProxyOverride is a ;-separated list of hosts not to proxy
    const proxyOverride = getValue(proxyValues, 'ProxyOverride')?.data;
    const noProxy = (proxyOverride ? (proxyOverride as string).split(';') : [])
        .flatMap((host) => host === '<local>'
            ? ['localhost', '127.0.0.1', '::1']
            : [host]
        );

    // ProxyServer is either a host, or a ;-separated list of key/value pairs mapping protocols to proxy hosts
    const proxyConfigString = proxyServer.data as string;

    if (proxyConfigString.includes('=')) {
        const proxies = Object.fromEntries(
            proxyConfigString
                .split(';')
                .map((proxyPair) => proxyPair.split('=') as [string, string])
        );

        const proxyUrl = proxies['https']
                ? `https://${proxies['https']}`
            : proxies['http']
                ? `http://${proxies['http']}`
            : proxies['socks']
                ? `socks://${proxies['socks']}`
            : undefined;

        if (!proxyUrl) {
            throw new Error(`Could not get usable proxy URL from ${proxyConfigString}`);
        }

        return {
            proxyUrl,
            noProxy
        };
    } else {
        return {
            proxyUrl: `http://${proxyConfigString}`,
            noProxy
        };
    }
}


const getValue = (values: readonly RegistryValue[], name: string) =>
    values.find((value) => value?.name === name);