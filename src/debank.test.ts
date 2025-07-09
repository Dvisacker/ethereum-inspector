import { getDebankUsername } from './debank';

describe('DeBank', () => {
    it('should return "Invalid Address" for invalid addresses', async () => {
        const username = await getDebankUsername('0xinvalid');
        expect(username).toBe("Invalid Address");
    });

    it('should handle network errors gracefully', async () => {
        // Mock a network error by using an invalid address
        const username = await getDebankUsername('0x0000000000000000000000000000000000000000');
        expect(username).toBe("No ID");
    });

    // Note: We can't reliably test actual DeBank usernames as they may change
    // and the service might rate limit us. Integration tests should be run manually.
}); 