-- =====================================================
-- Supabase 用户系统建表SQL
-- 执行方式：在Supabase SQL Editor中运行
-- =====================================================

-- 1. 创建用户表 users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wechat_id VARCHAR(100) UNIQUE NOT NULL,
    nickname VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    subscription_tier VARCHAR(20) DEFAULT 'free', -- free, basic, premium
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_users_wechat_id ON public.users(wechat_id);
CREATE INDEX IF NOT EXISTS idx_users_is_paid ON public.users(is_paid);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- 3. 启用RLS (行级安全策略)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. 创建RLS策略
-- 允许用户读取自己的记录
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- 允许用户更新自己的记录
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 允许匿名插入 (注册)
CREATE POLICY "users_insert" ON public.users
    FOR INSERT WITH CHECK (true);

-- 5. 创建登录日志表
CREATE TABLE IF NOT EXISTS public.login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    wechat_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    login_method VARCHAR(20) DEFAULT 'wechat', -- wechat, wechat_id
    success BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON public.login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON public.login_logs(created_at);

-- 6. 创建付费记录表
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CNY',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 7. 创建匿名认证（用于不需要邮箱注册的登录）
-- 注意：Supabase Auth需要邮箱，这里我们用匿名认证+自定义wechat_id
-- 实际使用中可以让用户输入邮箱作为用户名，或者使用手机号

-- 8. 添加帮助函数：获取或创建用户
CREATE OR REPLACE FUNCTION public.get_or_create_user(p_wechat_id TEXT)
RETURNS TABLE(
    id UUID,
    wechat_id TEXT,
    is_paid BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 尝试查找现有用户
    RETURN QUERY
    SELECT u.id, u.wechat_id, u.is_paid, u.created_at
    FROM public.users u
    WHERE u.wechat_id = p_wechat_id;
    
    -- 如果不存在，则创建新用户
    IF NOT FOUND THEN
        INSERT INTO public.users (wechat_id, created_at)
        VALUES (p_wechat_id, NOW())
        RETURNING id, wechat_id, is_paid, created_at;
    END IF;
END;
$$;

-- 9. 添加更新最后登录时间函数
CREATE OR REPLACE FUNCTION public.update_login(p_wechat_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.users 
    SET last_login_at = NOW(), 
        login_count = login_count + 1
    WHERE wechat_id = p_wechat_id;
END;
$$;
