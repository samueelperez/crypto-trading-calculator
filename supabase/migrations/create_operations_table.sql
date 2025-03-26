-- Tabla para operaciones de trading y transacciones
CREATE TABLE IF NOT EXISTS public.operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
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

-- Habilitar RLS en operations
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

-- Política para solo ver y modificar operaciones propias
CREATE POLICY "Users can view their own operations" 
    ON public.operations 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own operations" 
    ON public.operations 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own operations" 
    ON public.operations 
    FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own operations" 
    ON public.operations 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Tabla para historial de precios
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    price DECIMAL NOT NULL,
    volume DECIMAL,
    market_cap DECIMAL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(asset_id, timestamp)
);

-- Habilitar RLS en price_history (datos públicos pero solo admin puede modificar)
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan ver el historial de precios
CREATE POLICY "Everyone can view price history" 
    ON public.price_history 
    FOR SELECT 
    USING (true);

-- Tabla para cuentas de intercambio (si es necesaria)
CREATE TABLE IF NOT EXISTS public.exchange_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange_id UUID NOT NULL REFERENCES public.exchanges(id) ON DELETE CASCADE,
    nickname TEXT,
    api_key TEXT,
    api_secret TEXT, -- Debe ser encriptado a nivel de aplicación
    is_demo BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en exchange_accounts
ALTER TABLE public.exchange_accounts ENABLE ROW LEVEL SECURITY;

-- Política para solo ver y modificar cuentas propias
CREATE POLICY "Users can view their own exchange accounts" 
    ON public.exchange_accounts 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exchange accounts" 
    ON public.exchange_accounts 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exchange accounts" 
    ON public.exchange_accounts 
    FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exchange accounts" 
    ON public.exchange_accounts 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Añadir exchange_account_id a operations si no existe
ALTER TABLE public.operations 
ADD COLUMN IF NOT EXISTS exchange_account_id UUID 
REFERENCES public.exchange_accounts(id) ON DELETE SET NULL;

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_operations_portfolio ON public.operations(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_operations_asset ON public.operations(asset_id);
CREATE INDEX IF NOT EXISTS idx_price_history_asset_time ON public.price_history(asset_id, timestamp);

-- Actualizar la función calculate_portfolio_balance
CREATE OR REPLACE FUNCTION public.calculate_portfolio_balance(portfolio_id UUID)
RETURNS TABLE (
    asset_symbol TEXT,
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
        SUM(po.adjusted_quantity) AS total_quantity
    FROM 
        portfolio_operations po
    GROUP BY 
        po.asset_id, po.symbol
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