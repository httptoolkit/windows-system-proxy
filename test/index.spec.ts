import { expect } from 'chai';
import { getWindowsSystemProxy } from '../src/index';

describe("windows-system-proxy", () => {
    it("can get the Windows system proxy", async function () {
        if (process.platform !== 'win32') return this.skip();

        expect(
            await getWindowsSystemProxy()
        ).to.equal(undefined);
    });
});