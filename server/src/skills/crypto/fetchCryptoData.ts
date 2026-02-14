import z from "zod";

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
        .describe(
            'The amount of cryptocurrency. Defaults to 1 if not specified'
        ),
})

export const fetchCrypto = async ({ ticker, name, quantity }: z.infer<typeof cryptoInputSchema>) => {
    try {
        const id = `${ticker.toLowerCase()}-${name.toLowerCase()}`;
        const url = `https://api.coinpaprika.com/v1/tickers/${id}`

        interface IApiResponse {
            rank: number;
            total_supply: number;
            beta_value: number;
            quotes: {
                USD: {
                    price: number;
                    volume_24h: number;
                    volume_24h_change_24h: number;
                    market_cap: number;
                    percent_change_24h: number;
                    percent_change_7d: number;
                    percent_change_30d: number;
                    percent_change_1y: number;
                    ath_price: number;
                    ath_date: string;
                    percent_from_price_ath: number;
                };
            }
        }
        const {
            rank,
            total_supply,
            beta_value,
            quotes: {
                USD: {
                    price,
                    volume_24h,
                    market_cap,
                    percent_change_24h,
                    percent_change_7d,
                    percent_change_30d,
                    percent_change_1y,
                    ath_price,
                    ath_date,
                    percent_from_price_ath
                }
            }
        }: IApiResponse = await fetch(url).then(data => data.json())

        const totalPrice = quantity !== 1 ? price * quantity : price;

        const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
        const formatPercent = (value: number) => `${value.toFixed(2)}%`;

        const priceText = quantity === 1 ? `Current price: ${formatCurrency(price)}` : `Total price for ${quantity} ${ticker}: ${formatCurrency(totalPrice)}`;

        const statsText = [
            `Rank: ${rank}`,
            `Market Cap: ${formatCurrency(market_cap)}`,
            `24h Volume: ${formatCurrency(volume_24h)}`,
            `Price change in the last 24h: ${formatPercent(percent_change_24h)}`,
            `Price change in the last 7d: ${formatPercent(percent_change_7d)}`,
            `Price change in the last 30d: ${formatPercent(percent_change_30d)}`,
            `Price change in the last 1y: ${formatPercent(percent_change_1y)}`,
            `All-Time High: ${formatCurrency(ath_price)} on ${new Date(ath_date).toLocaleDateString()}`,
            `Currently ${formatPercent(percent_from_price_ath)} from ATH`,
            `Total Supply: ${total_supply.toLocaleString()}`,
            `Beta value: ${beta_value.toFixed(2)}`
        ];

        const fullInfo = [
            `=== ${name.toUpperCase()} (${ticker}) ===`,
            priceText,
            ...statsText
        ].map(s => s.trim()).join("\n");

        return {
            content: [
                {
                    type: "text",
                    text: fullInfo,
                },
            ],
        }
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve cryptocurrency data",
                },
            ],
        }
    }
}