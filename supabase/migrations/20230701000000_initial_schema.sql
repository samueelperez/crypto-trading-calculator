-- Habilitar la extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios (perfil extendido)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de configuraciones globales por usuario
CREATE TABLE IF NOT EXISTS global_settings (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  initial_capital NUMERIC DEFAULT 0,
  portfolio_value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de exchanges
CREATE TABLE IF NOT EXISTS exchanges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de conexiones a exchanges por usuario
CREATE TABLE IF NOT EXISTS user_exchanges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  exchange_id UUID REFERENCES exchanges NOT NULL,
  api_key TEXT,
  api_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, exchange_id)
);

-- Tabla de activos
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  exchange_id UUID REFERENCES exchanges,
  symbol TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  purchase_price_avg NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  logo_url TEXT
);

-- Tabla de entradas del journal de trading
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL,
  asset TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  position_size NUMERIC NOT NULL,
  leverage NUMERIC DEFAULT 1,
  risk_amount NUMERIC,
  risk_percentage NUMERIC,
  exit_price NUMERIC,
  profit_loss NUMERIC,
  status TEXT DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- Configurar políticas de seguridad a nivel de fila (RLS)
-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para global_settings
CREATE POLICY "Los usuarios pueden ver sus propias configuraciones"
  ON global_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias configuraciones"
  ON global_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar sus propias configuraciones"
  ON global_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para user_exchanges
CREATE POLICY "Los usuarios pueden ver sus propias conexiones a exchanges"
  ON user_exchanges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias conexiones a exchanges"
  ON user_exchanges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar sus propias conexiones a exchanges"
  ON user_exchanges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias conexiones a exchanges"
  ON user_exchanges FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para assets
CREATE POLICY "Los usuarios pueden ver sus propios activos"
  ON assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios activos"
  ON assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar sus propios activos"
  ON assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios activos"
  ON assets FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para journal_entries
CREATE POLICY "Los usuarios pueden ver sus propias entradas de journal"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias entradas de journal"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar sus propias entradas de journal"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias entradas de journal"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Crear función para gestionar actualizaciones de perfiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  
  -- Crear configuración global inicial para el usuario
  INSERT INTO public.global_settings (id, user_id, initial_capital, portfolio_value, currency)
  VALUES (gen_random_uuid()::text, new.id, 0, 0, 'USD');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevos usuarios
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insertar algunos exchanges comunes
INSERT INTO exchanges (name, logo_url) VALUES 
('Binance', 'https://assets.coingecko.com/markets/images/52/small/binance.jpg?1519353250'),
('Coinbase', 'https://assets.coingecko.com/markets/images/23/small/Coinbase_Coin_Primary.png?1621471875'),
('Kraken', 'https://assets.coingecko.com/markets/images/29/small/kraken.jpg?1584251255'),
('KuCoin', 'https://assets.coingecko.com/markets/images/61/small/kucoin.png?1640584259')
ON CONFLICT DO NOTHING; 