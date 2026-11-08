-- Profi.UZ specialist photo uploads. Run once in Supabase SQL Editor.
-- Public images only; upload restricted to signed-in owner's UUID folder.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('specialist-media','specialist-media',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "specialist_media_public_read" on storage.objects;
create policy "specialist_media_public_read" on storage.objects for select to public
using (bucket_id='specialist-media');

drop policy if exists "specialist_media_owner_insert" on storage.objects;
create policy "specialist_media_owner_insert" on storage.objects for insert to authenticated
with check (bucket_id='specialist-media' and (storage.foldername(name))[1]=(select auth.uid())::text
and exists(select 1 from public.profiles where id=(select auth.uid()) and role='specialist'));

drop policy if exists "specialist_media_owner_delete" on storage.objects;
create policy "specialist_media_owner_delete" on storage.objects for delete to authenticated
using (bucket_id='specialist-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
