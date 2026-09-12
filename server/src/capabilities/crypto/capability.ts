import { capability } from "../../services/capabilities";
import { fetchCryptoAction } from "./actions/fetchCryptoData";
import { getMarketOverviewAction } from "./actions/getMarketOverview";

export const cryptoDefinition = {
        id: 'crypto',
        description: "Provides cryptocurrency market data and analysis.",
        actions: {
            fetch_crypto: fetchCryptoAction,
            get_market_overview: getMarketOverviewAction
        },
    }

export const cryptoCapability = capability({
    definition: cryptoDefinition
});