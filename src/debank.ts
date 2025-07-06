import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Page } from 'puppeteer';
import { logger } from './logger';

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

// Queue for sequential processing
let processingQueue: Promise<any> = Promise.resolve();
const RATE_LIMIT_DELAY = 10000; // 10 seconds between requests

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Process username by removing 'VIP' suffix if present
 */
function processUsername(username: string | null): string | null {
    if (!username) return null;

    // Trim any whitespace first
    let processed = username.trim();

    // Remove 'VIP' from the end if present
    if (processed.endsWith('VIP')) {
        processed = processed.slice(0, -3).trim();
    }

    return processed || null; // Return null if the username becomes empty after processing
}

/**
 * Check if the page contains a WAF block message
 */
async function isBlockedByWaf(page: Page): Promise<boolean> {
    try {
        // Look for the error message about WAF blocking
        const blockedText = await page.evaluate(() => {
            const errorElements = document.querySelectorAll('.ant-message-error');
            for (const el of errorElements) {
                if (el.textContent?.includes('Request too fast, blocked by waf')) {
                    return true;
                }
            }
            return false;
        });

        return blockedText;
    } catch (error) {
        // If there's an error evaluating, assume it's not blocked
        return false;
    }
}

/**
 * Fetches a DeBank username for a single wallet address
 * This function is wrapped to ensure sequential processing
 */
async function fetchDebankUsernameInternal(address: string): Promise<string> {
    // Check if address is valid (basic check)
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        logger.debug(`Invalid address format: ${address}`, { meta: {} });
        return "Invalid Address";
    }

    let browser;
    try {
        logger.debug(`Launching browser for address: ${address}`, { meta: {} });
        browser = await puppeteer.launch({
            headless: true,
            defaultViewport: { width: 1280, height: 800 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        logger.debug('Browser page created', { meta: {} });

        // Set a realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        logger.debug('User agent set', { meta: {} });

        // Enable request interception for better stealth
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            // Block unnecessary resources to speed up loading
            const resourceType = req.resourceType();
            if (resourceType === 'image' || resourceType === 'font' || resourceType === 'media') {
                req.abort();
            } else {
                req.continue();
            }
        });
        logger.debug('Request interception configured', { meta: {} });

        // Navigate to DeBank profile page
        const url = `https://debank.com/profile/${address}`;
        logger.debug(`Navigating to: ${url}`, { meta: {} });
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for the page to load completely
        logger.debug('Waiting for body element', { meta: {} });
        await page.waitForSelector('body', { timeout: 60000 });

        // Wait additional time to ensure everything is loaded
        logger.debug('Additional wait for page load', { meta: {} });
        await sleep(3000);

        // Check if we're blocked by WAF
        if (await isBlockedByWaf(page)) {
            logger.debug('WAF block detected', { meta: {} });
            throw new Error('Request too fast, blocked by waf');
        }

        // Extract the username from the HeaderInfo_uid element
        let username = null;
        try {
            logger.debug('Waiting for username element', { meta: {} });
            await page.waitForSelector('.HeaderInfo_uid__kyxYI', { timeout: 20000 });
            username = await page.evaluate(() => {
                const element = document.querySelector('.HeaderInfo_uid__kyxYI');
                return element ? element.textContent : null;
            });

            // Process the username to remove VIP suffix
            username = processUsername(username);
            logger.debug(`Found username: ${username}`, { meta: {} });

        } catch (error: any) {
            logger.warn(`Could not find username for ${address}: ${error.message}`, { meta: {} });
            return "No ID";
        }

        return username || "No ID";

    } catch (error: any) {
        logger.error(`Error fetching DeBank username for ${address}: ${error.message}`, { meta: {} });
        return "No ID";
    } finally {
        if (browser) {
            logger.debug('Closing browser', { meta: {} });
            await browser.close();
        }
    }
}

/**
 * Public function to get DeBank username that ensures sequential processing
 */
export async function getDebankUsername(address: string): Promise<string> {
    // Add this request to the processing queue
    processingQueue = processingQueue
        .then(async () => {
            logger.debug(`Starting DeBank request for ${address}`, { meta: {} });
            const result = await fetchDebankUsernameInternal(address);
            // Add rate limit delay after each request
            logger.debug(`Waiting ${RATE_LIMIT_DELAY}ms before next request`, { meta: {} });
            await sleep(RATE_LIMIT_DELAY);
            return result;
        })
        .catch(error => {
            logger.error(`Queue processing error for ${address}: ${error.message}`, { meta: {} });
            return "No ID";
        });

    return processingQueue;
} 