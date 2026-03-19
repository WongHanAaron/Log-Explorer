import { UiE2EError } from "./errors";

type BrowserLike = {
    close: () => Promise<void>;
    newPage: () => Promise<PageLike>;
};

type PageLike = {
    goto: (url: string) => Promise<void>;
    click: (selector: string) => Promise<void>;
    fill: (selector: string, value: string) => Promise<void>;
    isVisible: (selector: string) => Promise<boolean>;
    textContent: (selector: string) => Promise<string | null>;
    waitForSelector: (selector: string, options?: { timeout?: number }) => Promise<void>;
    screenshot: (options: { path: string; fullPage: boolean }) => Promise<void>;
};

type ChromiumLike = {
    launch: (options: { headless: boolean; slowMo?: number }) => Promise<BrowserLike>;
};

async function resolveChromium(): Promise<ChromiumLike> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const playwright = require("playwright");
        return playwright.chromium as ChromiumLike;
    } catch {
        throw new UiE2EError(
            "E2E_PLAYWRIGHT_NOT_INSTALLED",
            "Playwright is required for browser automation steps.",
            "Install with: npm install --save-dev playwright"
        );
    }
}

export class WebviewDriver {
    private browser?: BrowserLike;
    private page?: PageLike;

    public async openBrowser(headless: boolean, slowMo = 0): Promise<void> {
        if (this.browser) {
            await this.close();
        }
        const chromium = await resolveChromium();
        this.browser = await chromium.launch({ headless, slowMo });
        this.page = await this.browser.newPage();
    }

    private assertPage(): PageLike {
        if (!this.page) {
            throw new UiE2EError(
                "E2E_BROWSER_NOT_STARTED",
                "Browser page is not initialized.",
                "Add an openBrowser step before browser interaction steps."
            );
        }
        return this.page;
    }

    public async goto(url: string): Promise<void> {
        await this.assertPage().goto(url);
    }

    public async click(selector: string): Promise<void> {
        await this.assertPage().click(selector);
    }

    public async input(selector: string, value: string): Promise<void> {
        await this.assertPage().fill(selector, value);
    }

    public async isVisible(selector: string): Promise<boolean> {
        return this.assertPage().isVisible(selector);
    }

    public async textContent(selector: string): Promise<string> {
        return (await this.assertPage().textContent(selector)) ?? "";
    }

    public async waitForSelector(selector: string, timeout?: number): Promise<void> {
        await this.assertPage().waitForSelector(selector, { timeout });
    }

    public async screenshot(filePath: string): Promise<void> {
        await this.assertPage().screenshot({ path: filePath, fullPage: true });
    }

    public async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = undefined;
            this.page = undefined;
        }
    }
}
