import { defineAction } from "../../runtime/execute/defineAction";
import { cryptoInputSchema, cryptoOutputSchema, fetchCrypto } from "./fetchCryptoData";

export const actions = {
    fetch_crypto: defineAction({
        description: "Fetches market data for a cryptocurrency, including price and trading metrics.",
        inputSchema: cryptoInputSchema,
        outputSchema: cryptoOutputSchema,
        handler: fetchCrypto,
    }),
};