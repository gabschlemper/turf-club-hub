-- ============================================
-- POLICY PARA INSERIR AUDITS
-- Execute no Supabase SQL Editor
-- ============================================

-- Remover policy antiga se existir
DROP POLICY IF EXISTS "Authenticated users can insert audits" ON public.audits;

-- Criar policy para usuários autenticados criarem audits
CREATE POLICY "Authenticated users can insert audits"
ON public.audits FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- FIM
-- ============================================
