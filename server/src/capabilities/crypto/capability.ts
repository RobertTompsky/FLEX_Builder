import { capability } from "../../services/capabilities";
import { fetchCryptoAction } from "./actions/fetchCryptoData";
import { createGetMarketOverviewAction } from "./actions/getMarketOverview";
import { CryptoContext } from "./actions/types";

export function createCryptoCapability(
    context: CryptoContext,
) {
    return capability({
        id: "crypto",
        description: "Provides cryptocurrency market data and analysis.",

        actions: {
            fetch_crypto: fetchCryptoAction,
            get_market_overview:
                createGetMarketOverviewAction(
                    context,
                ),
        },
    });
}