import { fetchCryptoAction } from "./actions/fetchCryptoData";
import { capability } from "../../runtime/execute";
import { getMarketOverviewAction } from "./actions/getMarketOverview";

export const cryptoCapability = capability({
    id: 'crypto',
    description: "Provides cryptocurrency market data and analysis.",
    actions: {
        fetch_crypto: fetchCryptoAction,
        get_market_overview: getMarketOverviewAction
    },
});