-- ════════════════════════════════════════════════════════════
-- CAMA SaaS · Étape 7 — Administration de la plateforme
--
-- Jusqu'ici, « super-admin plateforme » voulait dire : n'importe quel
-- utilisateur dont admin_level = 'super_admin'. Or ce niveau se donne
-- DANS un établissement (le recteur, via /admin/roles). Le super-admin
-- d'un institut voyait donc les données de tous les autres instituts.
--
-- On sépare les deux :
--   · admin_level = 'super_admin'  → gouvernance de SON établissement ;
--   · is_platform_admin = true     → l'équipe CAMA, transverse à tous.
--
-- Le drapeau ne se donne qu'en SQL (éditeur Supabase) ou avec la clé
-- service : un utilisateur ne peut ni se l'attribuer, ni le modifier.
--
-- Idempotent : réexécutable sans danger.
-- ════════════════════════════════════════════════════════════

-- 1. Le drapeau
alter table public.users
  add column if not exists is_platform_admin boolean not null default false;

comment on column public.users.is_platform_admin is
  'Équipe CAMA : voit et gère tous les établissements. Attribué en SQL uniquement.';

-- 2. Personne ne se l'attribue par l'API (rôles anon / authenticated).
--    L'éditeur SQL (postgres) et la clé service (service_role) passent.
create or replace function public.protege_platform_admin() returns trigger
  language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' and new.is_platform_admin then
      raise exception 'is_platform_admin ne peut pas être attribué depuis l''application';
    end if;
    if tg_op = 'UPDATE' and new.is_platform_admin is distinct from old.is_platform_admin then
      raise exception 'is_platform_admin ne peut pas être modifié depuis l''application';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists users_protege_platform_admin on public.users;
create trigger users_protege_platform_admin
  before insert or update on public.users
  for each row execute function public.protege_platform_admin();

-- 3. La fonction utilisée par toutes les règles RLS (028, 029, 033…) lit
--    désormais le drapeau, et non plus admin_level.
--    ⚠ Effet voulu : un super_admin d'établissement ne voit plus que SON
--    établissement. Donnez is_platform_admin à l'équipe CAMA (étape 4).
create or replace function public.is_platform_admin() returns boolean
  language sql stable security definer set search_path = public as $$
    select coalesce(
      (select is_platform_admin from public.users where id = auth.uid()),
      false)
  $$;

-- 4. Désigner l'équipe CAMA — à adapter, puis exécuter à la main :
-- update public.users set is_platform_admin = true where email = 'votre-email@exemple.com';

-- Recharge du schéma pour l'API (PostgREST)
notify pgrst, 'reload schema';
