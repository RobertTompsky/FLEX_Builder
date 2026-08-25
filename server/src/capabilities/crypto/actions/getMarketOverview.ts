import z from "zod";
import { action } from "../../../runtime/execute";

export const marketOverviewInputSchema = z.object({});

export const marketOverviewOutputSchema =
    z.object({
        market: z.object({
            totalMarketCapUsd: z
                .number()
                .describe(
                    "Total cryptocurrency market capitalization in USD.",
                ),

            totalVolume24hUsd: z
                .number()
                .describe(
                    "Total adjusted cryptocurrency trading volume over the last 24 hours in USD.",
                ),

            totalVolume24hReportedUsd: z
                .number()
                .describe(
                    "Total reported cryptocurrency trading volume over the last 24 hours in USD.",
                ),

            marketTurnoverPercent: z
                .number()
                .describe(
                    "Adjusted 24-hour trading volume as a percentage of total cryptocurrency market capitalization.",
                ),
        }),

        dominance: z.object({
            btcPercent: z
                .number()
                .describe(
                    "Bitcoin's share of total cryptocurrency market capitalization, in percent.",
                ),

            ethPercent: z
                .number()
                .describe(
                    "Ethereum's share of total cryptocurrency market capitalization, in percent.",
                ),

            altcoinPercent: z
                .number()
                .describe(
                    "Share of total cryptocurrency market capitalization excluding Bitcoin, in percent.",
                ),
        }),

        bitcoin: z.object({
            marketCapUsd: z
                .number()
                .describe(
                    "Estimated Bitcoin market capitalization in USD, derived from total market cap minus altcoin market cap.",
                ),
        }),

        altcoins: z.object({
            marketCapUsd: z
                .number()
                .describe(
                    "Total cryptocurrency market capitalization excluding Bitcoin.",
                ),

            volume24hUsd: z
                .number()
                .describe(
                    "Total adjusted 24-hour trading volume excluding Bitcoin.",
                ),

            volume24hReportedUsd: z
                .number()
                .describe(
                    "Total reported 24-hour trading volume excluding Bitcoin.",
                ),

            volumeSharePercent: z
                .number()
                .describe(
                    "Altcoin adjusted trading volume as a percentage of total adjusted cryptocurrency trading volume.",
                ),
        }),

        sentiment: z.object({
            fearAndGreed: z.object({
                value: z
                    .number()
                    .int()
                    .min(0)
                    .max(100)
                    .describe(
                        "Current Crypto Fear & Greed Index value from 0 to 100.",
                    ),

                classification: z
                    .string()
                    .describe(
                        "Current Crypto Fear & Greed sentiment classification.",
                    ),

                timestamp: z
                    .string()
                    .describe(
                        "ISO timestamp when the Fear & Greed Index value was recorded.",
                    ),
            }),
        }),

        activity: z.object({
            activeCryptocurrencies: z
                .number()
                .int()
                .nonnegative()
                .describe(
                    "Number of active cryptocurrencies tracked by CoinMarketCap.",
                ),

            totalCryptocurrencies: z
                .number()
                .int()
                .nonnegative()
                .describe(
                    "Total number of cryptocurrencies tracked by CoinMarketCap, including inactive assets.",
                ),

            activeMarketPairs: z
                .number()
                .int()
                .nonnegative()
                .describe(
                    "Number of active cryptocurrency market pairs tracked by CoinMarketCap.",
                ),

            activeExchanges: z
                .number()
                .int()
                .nonnegative()
                .describe(
                    "Number of active cryptocurrency exchanges tracked by CoinMarketCap.",
                ),

            totalExchanges: z
                .number()
                .int()
                .nonnegative()
                .describe(
                    "Total number of cryptocurrency exchanges tracked by CoinMarketCap, including inactive exchanges.",
                ),
        }),

        lastUpdated: z
            .string()
            .describe(
                "ISO timestamp when CoinMarketCap global market metrics were last updated.",
            ),
    });

type MarketOverviewInput =
    z.infer<
        typeof marketOverviewInputSchema
    >;

type MarketOverviewOutput =
    z.infer<
        typeof marketOverviewOutputSchema
    >;

interface CoinMarketCapGlobalResponse {
    data: {
        btc_dominance: number;
        eth_dominance: number;

        active_cryptocurrencies: number;
        total_cryptocurrencies: number;

        active_market_pairs: number;

        active_exchanges: number;
        total_exchanges: number;

        last_updated: string;

        quote: {
            USD: {
                total_market_cap: number;

                total_volume_24h: number;
                total_volume_24h_reported: number;

                altcoin_market_cap: number;

                altcoin_volume_24h: number;
                altcoin_volume_24h_reported: number;

                last_updated: string;
            };
        };
    };

    status: {
        error_code: number;

        error_message:
        | string
        | null;
    };
}

interface AlternativeMeFngResponse {
    data: Array<{
        value: string;

        value_classification: string;

        timestamp: string;

        time_until_update?: string;
    }>;

    metadata: {
        error: unknown;
    };
}

export const getMarketOverview = async (
    _input: MarketOverviewInput,
): Promise<MarketOverviewOutput> => {
    const apiKey = process.env.COINMARKETCAP_API_KEY;

    if (!apiKey) {
        throw new Error(
            "COINMARKETCAP_API_KEY is not configured.",
        );
    }

    const [
        marketResponse,
        fngResponse,
    ] = await Promise.all([
        fetch(
            "https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest",
            {
                headers: {
                    "X-CMC_PRO_API_KEY":
                        apiKey,

                    Accept:
                        "application/json",
                },
            },
        ),
        fetch("https://api.alternative.me/fng/"),
    ]);

    if (!marketResponse.ok) {
        const body =
            await marketResponse.text();

        throw new Error(
            `Failed to retrieve CoinMarketCap global metrics: ${marketResponse.status} ${marketResponse.statusText}. ${body}`,
        );
    }

    if (!fngResponse.ok) {
        const body =
            await fngResponse.text();

        throw new Error(
            `Failed to retrieve Fear & Greed Index: ${fngResponse.status} ${fngResponse.statusText}. ${body}`,
        );
    }

    const market =
        (await marketResponse.json()) as
        CoinMarketCapGlobalResponse;

    const fng =
        (await fngResponse.json()) as
        AlternativeMeFngResponse;

    if (market.status.error_code !== 0) {
        throw new Error(
            `CoinMarketCap returned an error: ${market.status
                .error_message ??
            market.status.error_code
            }`,
        );
    }

    if (fng.metadata?.error) {
        throw new Error(
            `Fear & Greed API returned an error: ${String(
                fng.metadata.error,
            )}`,
        );
    }

    const usd = market.data.quote?.USD;

    if (!usd) {
        throw new Error(
            "CoinMarketCap returned no USD global quote.",
        );
    }

    const currentFng = fng.data?.[0];

    if (!currentFng) {
        throw new Error(
            "Fear & Greed API returned no index data.",
        );
    }

    const fngValue = Number(currentFng.value);
    const fngTimestamp = Number(currentFng.timestamp);

    if (
        !Number.isFinite(
            fngValue,
        ) ||
        !Number.isFinite(
            fngTimestamp,
        )
    ) {
        throw new Error(
            "Fear & Greed API returned invalid numeric data.",
        );
    }

    const {
        total_market_cap:
        totalMarketCapUsd,

        total_volume_24h:
        totalVolume24hUsd,

        total_volume_24h_reported:
        totalVolume24hReportedUsd,

        altcoin_market_cap:
        altcoinMarketCapUsd,

        altcoin_volume_24h:
        altcoinVolume24hUsd,

        altcoin_volume_24h_reported:
        altcoinVolume24hReportedUsd,
    } = usd;

    const btcMarketCapUsd =
        totalMarketCapUsd -
        altcoinMarketCapUsd;

    const altcoinDominancePercent =
        100 -
        market.data.btc_dominance;

    const marketTurnoverPercent =
        totalMarketCapUsd > 0
            ? (
                totalVolume24hUsd /
                totalMarketCapUsd
            ) * 100
            : 0;

    const altcoinShareOfVolumePercent =
        totalVolume24hUsd > 0
            ? (
                altcoinVolume24hUsd /
                totalVolume24hUsd
            ) * 100
            : 0;

    return marketOverviewOutputSchema.parse(
        {
            market: {
                totalMarketCapUsd,

                totalVolume24hUsd,

                totalVolume24hReportedUsd,

                marketTurnoverPercent,
            },

            dominance: {
                btcPercent:
                    market.data
                        .btc_dominance,

                ethPercent:
                    market.data
                        .eth_dominance,

                altcoinPercent:
                    altcoinDominancePercent,
            },

            bitcoin: {
                marketCapUsd:
                    btcMarketCapUsd,
            },

            altcoins: {
                marketCapUsd:
                    altcoinMarketCapUsd,

                volume24hUsd:
                    altcoinVolume24hUsd,

                volume24hReportedUsd:
                    altcoinVolume24hReportedUsd,

                volumeSharePercent:
                    altcoinShareOfVolumePercent,
            },

            sentiment: {
                fearAndGreed: {
                    value:
                        fngValue,

                    classification:
                        currentFng
                            .value_classification,

                    timestamp:
                        new Date(
                            fngTimestamp *
                            1000,
                        ).toISOString(),
                },
            },

            activity: {
                activeCryptocurrencies:
                    market.data
                        .active_cryptocurrencies,

                totalCryptocurrencies:
                    market.data
                        .total_cryptocurrencies,

                activeMarketPairs:
                    market.data
                        .active_market_pairs,

                activeExchanges:
                    market.data
                        .active_exchanges,

                totalExchanges:
                    market.data
                        .total_exchanges,
            },

            lastUpdated:
                market.data
                    .last_updated,
        },
    );
};

export const getMarketOverviewAction =
    action({
        description:
            "Fetches a global cryptocurrency market snapshot including market capitalization, trading activity, Bitcoin and Ethereum dominance, altcoin metrics, market turnover, and Fear & Greed sentiment.",

        inputSchema:
            marketOverviewInputSchema,

        outputSchema:
            marketOverviewOutputSchema,

        handler:
            getMarketOverview,
    });