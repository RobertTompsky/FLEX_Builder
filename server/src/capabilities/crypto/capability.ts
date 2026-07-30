import { fetchCryptoAction } from "./actions/fetchCryptoData";
import { capability } from "../../runtime/execute";

export const cryptoCapability = capability({
    id: 'crypto',
    description: "Provides cryptocurrency market data and analysis.",
    actions: {
        fetch_crypto: fetchCryptoAction,
    },
});