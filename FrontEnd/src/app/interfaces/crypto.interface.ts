export interface MarketData {
    current_price: {
        usd: number | string;
    };
    market_cap: {
        usd: number | string;
    };
    total_volume: {
        usd: number | string;
    };
    high_24h?: {
        usd: number | string;
    };
    low_24h?: {
        usd: number | string;
    };
    price_change_24h: number;
    price_change_percentage_24h: number;
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
}

export interface CryptoDetail {
    id: string;
    symbol: string;
    name: string;
    image: {
        thumb: string;
        small: string;
        large: string;
    };
    market_data: MarketData;
    additional_data?: {
        trading_status: string;
        base_asset_precision: number;
        quote_asset_precision: number;
    };
}

export interface CryptoListItem {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number | string;
    market_cap: number | string;
    total_volume: number | string;
    price_change_24h: number;
    price_change_percentage_24h: number;
    circulating_supply: number;
    last_updated: string;
} 