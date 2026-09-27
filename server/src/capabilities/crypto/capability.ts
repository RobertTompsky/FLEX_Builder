import { capability } from "../../services/capabilities";
import { fetchCryptoAction } from "./actions/fetchCryptoData";
import { getMarketOverviewAction } from "./actions/getMarketOverview";

export const CRYPTO_CAPABILITY_DEFINITION = {
    id: "crypto",
    description: "Provides cryptocurrency market data and analysis."
}

export const cryptoCapability = capability({
    ...CRYPTO_CAPABILITY_DEFINITION,

    actions: {
        fetch_crypto: fetchCryptoAction,
        get_market_overview: getMarketOverviewAction
    },
});