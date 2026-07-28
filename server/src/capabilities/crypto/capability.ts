import {
    defineCapability,
} from "../../runtime/execute/defineCapability";
import { fetchCryptoAction } from "./actions/fetchCryptoData";

export default defineCapability({
    id: 'crypto',
    description: "Provides cryptocurrency market data and analysis.",
    actions: {
        fetch_crypto: fetchCryptoAction,
    },
});