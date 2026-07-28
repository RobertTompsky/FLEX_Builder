import z from "zod";
import { defineAction } from "../../../runtime/execute/defineAction";

export const cryptoInputSchema = z.object({
    ticker: z
        .string()
        .describe(
            "The official ticker symbol of the cryptocurrency, a short, uppercase code used" +
            "on exchanges and in APIs (e.g., 'BTC' for Bitcoin, 'ETH' for Ethereum, 'SOL' for Solana)."
        ),
    name: z
        .string()
        .describe(
            "The official name of the cryptocurrency used on exchanges and in APIs" +
            "(e.g., 'bitcoin', 'ethereum', 'dogecoin')."
        ),
    quantity: z
        .number()
        .positive()
        .default(1)
        .describe(
            "The amount of cryptocurrency. Defaults to 1 if omitted.",
        ),
})

export const cryptoOutputSchema = z.object({
    ticker: z
        .string()
        .describe("Uppercase cryptocurrency ticker symbol."),

    name: z
        .string()
        .describe("Cryptocurrency name or CoinPaprika slug."),

    quantity: z
        .number()
        .positive()
        .describe("Requested amount of cryptocurrency."),

    priceUsd: z
        .number()
        .describe("Current price of one unit in USD."),

    totalPriceUsd: z
        .number()
        .describe("Current value of the requested quantity in USD."),

    rank: z
        .number()
        .int()
        .positive()
        .describe("Current CoinPaprika market-cap rank."),

    marketCapUsd: z
        .number()
        .describe("Current market capitalization in USD."),

    volume24hUsd: z
        .number()
        .describe("Trading volume in USD over the last 24 hours."),

    volume24hChangePercent: z
        .number()
        .optional()
        .describe("Percentage change in 24-hour trading volume, when available."),

    priceChanges: z.object({
        change24hPercent: z
            .number()
            .describe("Price change over the last 24 hours, in percent."),

        change7dPercent: z
            .number()
            .describe("Price change over the last 7 days, in percent."),

        change30dPercent: z
            .number()
            .describe("Price change over the last 30 days, in percent."),

        change1yPercent: z
            .number()
            .describe("Price change over the last 1 year, in percent."),
    }),

    allTimeHigh: z.object({
        priceUsd: z
            .number()
            .describe("All-time high price in USD."),

        date: z
            .string()
            .describe("ISO date when the all-time high was recorded."),

        distancePercent: z
            .number()
            .describe(
                "Current price distance from the all-time high, in percent.",
            ),
    }),

    totalSupply: z
        .number()
        .nullable()
        .describe("Total token supply, or null when unavailable."),

    betaValue: z
        .number()
        .nullable()
        .describe("CoinPaprika beta value, or null when unavailable."),

});

type CryptoInput = z.infer<typeof cryptoInputSchema>;
type CryptoOutput = z.infer<typeof cryptoOutputSchema>;

interface CoinPaprikaResponse {
    rank: number;
    total_supply: number | null;
    beta_value: number | null;
    quotes: {
        USD: {
            price: number;
            volume_24h: number;
            volume_24h_change_24h?: number;
            market_cap: number;
            percent_change_24h: number;
            percent_change_7d: number;
            percent_change_30d: number;
            percent_change_1y: number;
            ath_price: number;
            ath_date: string;
            percent_from_price_ath: number;
        };
    };
}

export const fetchCrypto = async (
    { ticker, name, quantity }: CryptoInput
): Promise<CryptoOutput> => {

    const id = `${ticker.toLowerCase()}-${name.toLowerCase()}`;
    const url = `https://api.coinpaprika.com/v1/tickers/${id}`

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to retrieve cryptocurrency data: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as CoinPaprikaResponse;

    const usd = data.quotes?.USD;

    if (!usd) {
        throw new Error(`CoinPaprika returned no USD quote for ${ticker}`);
    }

    return cryptoOutputSchema.parse({
        ticker,
        name,
        quantity,
        priceUsd: usd.price,
        totalPriceUsd: usd.price * quantity,
        rank: data.rank,
        marketCapUsd: usd.market_cap,
        volume24hUsd: usd.volume_24h,
        volume24hChangePercent: usd.volume_24h_change_24h,
        priceChanges: {
            change24hPercent: usd.percent_change_24h,
            change7dPercent: usd.percent_change_7d,
            change30dPercent: usd.percent_change_30d,
            change1yPercent: usd.percent_change_1y,
        },
        allTimeHigh: {
            priceUsd: usd.ath_price,
            date: usd.ath_date,
            distancePercent: usd.percent_from_price_ath,
        },
        totalSupply: data.total_supply,
        betaValue: data.beta_value,
    })
}

export const fetchCryptoAction =
    defineAction({
        description:
            "Fetches market data for a cryptocurrency.",

        inputSchema:
            cryptoInputSchema,

        outputSchema:
            cryptoOutputSchema,

        handler:
            fetchCrypto,
    });