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

    // ProxyServer specifies the proxy host(s), but in a few different formats...
    const proxyConfigString = proxyServer.data as string;

    if (proxyConfigString.startsWith('http://') || proxyConfigString.startsWith('https://')) {
        // Unclear whether this is used in reality, but it's an example of a valid config in the microsoft
        // docs: https://docs.microsoft.com/en-us/troubleshoot/windows-client/networking/configure-client-proxy-server-settings-by-registry-file
        return {
            proxyUrl: proxyConfigString,
            noProxy
        };
    } else if (proxyConfigString.includes('=')) {
        // If you separately configure proxies by protocol (in Internet Settings), it seems to store them as a
        // list of protocol=host;protocol=host key value pairs. We use the best supported host we can find, assuming
        // that all proxies probably support both HTTP & HTTPS traffic in reality, because they do seem to.
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
        // Alternatively, it's often just a bare hostname, so we use that directly:
        return {
            proxyUrl: `http://${proxyConfigString}`,
            noProxy
        };
    }
}


const getValue = (values: readonly RegistryValue[], name: string) =>
    values.find((value) => value?.name === name);