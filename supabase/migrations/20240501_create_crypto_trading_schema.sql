-- Crear esquema básico para plataforma de trading de criptomonedas
-- Con Row Level Security (RLS) para aislar datos entre usuarios

-- 1. Tabla de perfiles de usuario (si no existe ya)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabla de portfolios/carteras
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tabla de activos/criptomonedas
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'crypto',
    logo_url TEXT,
    coingecko_id TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabla de exchanges
CREATE TABLE IF NOT EXISTS public.exchanges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    website_url TEXT,
    api_base_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Tabla de cuentas de exchanges del usuario
CREATE TABLE IF NOT EXISTS public.exchange_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange_id UUID NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
    nickname TEXT,
    api_key TEXT,
    api_secret TEXT,
    is_demo BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Tabla de operaciones/transacciones
CREATE TABLE IF NOT EXISTS public.operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    exchange_account_id UUID REFERENCES public.exchange_accounts(id) ON DELETE SET NULL,
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'transfer_in', 'transfer_out', 'stake', 'unstake', 'swap')),
    quantity DECIMAL NOT NULL,
    price_per_unit DECIMAL,
    fee DECIMAL DEFAULT 0,
    total_value DECIMAL,
    notes TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Tabla de precios históricos
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    price DECIMAL NOT NULL,
    volume DECIMAL,
    market_cap DECIMAL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(asset_id, timestamp)
);

-- Activar Row Level Security (RLS) en todas las tablas

-- 1. Perfiles - cada usuario solo ve su perfil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios solo ven su perfil" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- 2. Portfolios - cada usuario solo ve sus portfolios
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios solo ven sus portfolios" ON public.portfolios
    FOR ALL USING (auth.uid() = user_id);

-- 3. Activos - todos pueden ver los activos (información pública)
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Activos visibles para todos" ON public.assets
    FOR SELECT USING (true);
    
-- Solo administradores pueden modificar activos
CREATE POLICY "Solo admins modifican activos" ON public.assets
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Solo admins actualizan activos" ON public.assets
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Solo admins eliminan activos" ON public.assets
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- 4. Exchanges - todos pueden ver los exchanges (información pública)
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exchanges visibles para todos" ON public.exchanges
    FOR SELECT USING (true);
    
-- Solo administradores pueden modificar exchanges
CREATE POLICY "Solo admins modifican exchanges" ON public.exchanges
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Solo admins actualizan exchanges" ON public.exchanges
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Solo admins eliminan exchanges" ON public.exchanges
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- 5. Cuentas de exchanges - cada usuario solo ve sus propias cuentas
ALTER TABLE public.exchange_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios solo ven sus cuentas de exchanges" ON public.exchange_accounts
    FOR ALL USING (auth.uid() = user_id);

-- 6. Operaciones - cada usuario solo ve sus propias operaciones
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios solo ven sus operaciones" ON public.operations
    FOR ALL USING (auth.uid() = user_id);

-- 7. Precios históricos - todos pueden ver los precios (información pública)
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Precios visibles para todos" ON public.price_history
    FOR SELECT USING (true);
    
-- Solo administradores pueden modificar precios
CREATE POLICY "Solo admins modifican precios" ON public.price_history
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Solo admins actualizan precios" ON public.price_history
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Solo admins eliminan precios" ON public.price_history
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Modificar la función handle_new_user para crear datos iniciales para nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Confirmar email automáticamente
  UPDATE auth.users 
  SET email_confirmed_at = now()
  WHERE id = NEW.id;
  
  -- Crear perfil de usuario
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, now(), now());
  
  -- Crear portfolio predeterminado
  INSERT INTO public.portfolios (user_id, name, is_default, created_at, updated_at)
  VALUES (NEW.id, 'Portfolio principal', true, now(), now());
  
  RETURN NEW;
END;
$function$;

-- Datos iniciales para criptomonedas populares
INSERT INTO public.assets (symbol, name, type, coingecko_id)
VALUES 
  ('BTC', 'Bitcoin', 'crypto', 'bitcoin'),
  ('ETH', 'Ethereum', 'crypto', 'ethereum'),
  ('USDT', 'Tether', 'crypto', 'tether'),
  ('BNB', 'Binance Coin', 'crypto', 'binancecoin'),
  ('SOL', 'Solana', 'crypto', 'solana'),
  ('XRP', 'XRP', 'crypto', 'ripple'),
  ('ADA', 'Cardano', 'crypto', 'cardano'),
  ('DOGE', 'Dogecoin', 'crypto', 'dogecoin'),
  ('AVAX', 'Avalanche', 'crypto', 'avalanche-2'),
  ('DOT', 'Polkadot', 'crypto', 'polkadot')
ON CONFLICT (symbol) DO NOTHING;

-- Datos iniciales para exchanges populares
INSERT INTO public.exchanges (name, website_url)
VALUES 
  ('Binance', 'https://binance.com'),
  ('Coinbase', 'https://coinbase.com'),
  ('Kraken', 'https://kraken.com'),
  ('FTX', 'https://ftx.com'),
  ('Huobi', 'https://huobi.com'),
  ('Kucoin', 'https://kucoin.com'),
  ('Bitfinex', 'https://bitfinex.com'),
  ('Bybit', 'https://bybit.com')
ON CONFLICT (name) DO NOTHING;

-- Crear función para calcular balance del portfolio
CREATE OR REPLACE FUNCTION public.calculate_portfolio_balance(portfolio_id UUID)
RETURNS TABLE (
    asset_symbol TEXT,
    asset_name TEXT,
    total_quantity DECIMAL,
    current_price DECIMAL,
    total_value DECIMAL
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
WITH portfolio_operations AS (
    SELECT 
        a.id AS asset_id,
        a.symbol,
        a.name,
        o.type,
        CASE 
            WHEN o.type IN ('buy', 'transfer_in', 'unstake') THEN o.quantity
            WHEN o.type IN ('sell', 'transfer_out', 'stake') THEN -o.quantity
            WHEN o.type = 'swap' THEN 
                CASE WHEN o.asset_id = a.id THEN -o.quantity ELSE o.quantity END
            ELSE 0
        END AS adjusted_quantity
    FROM 
        public.operations o
    JOIN 
        public.assets a ON o.asset_id = a.id
    WHERE 
        o.portfolio_id = calculate_portfolio_balance.portfolio_id
),
asset_balances AS (
    SELECT 
        po.asset_id,
        po.symbol,
        po.name,
        SUM(po.adjusted_quantity) AS total_quantity
    FROM 
        portfolio_operations po
    GROUP BY 
        po.asset_id, po.symbol, po.name
    HAVING 
        SUM(po.adjusted_quantity) > 0
),
latest_prices AS (
    SELECT 
        ph.asset_id,
        ph.price
    FROM 
        public.price_history ph
    INNER JOIN (
        SELECT 
            asset_id, 
            MAX(timestamp) AS max_timestamp
        FROM 
            public.price_history
        GROUP BY 
            asset_id
    ) latest ON ph.asset_id = latest.asset_id AND ph.timestamp = latest.max_timestamp
)
SELECT 
    ab.symbol AS asset_symbol,
    ab.name AS asset_name,
    ab.total_quantity,
    COALESCE(lp.price, 0) AS current_price,
    COALESCE(ab.total_quantity * lp.price, 0) AS total_value
FROM 
    asset_balances ab
LEFT JOIN 
    latest_prices lp ON ab.asset_id = lp.asset_id
ORDER BY 
    total_value DESC;
$$; 