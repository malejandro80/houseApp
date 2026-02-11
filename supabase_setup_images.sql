-- 1. Create a storage bucket for property images
insert into storage.buckets (id, name, public) 
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

-- 2. Policy to allow authenticated uploads to the bucket
create policy "Authenticated users can upload images"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'property-images' );

-- 3. Policy to allow public to view images in the bucket
create policy "Public access to images"
on storage.objects for select
to public
using ( bucket_id = 'property-images' );

-- 4. Policy to allow users to update their own images (delete/replace)
create policy "Users can update their own images"
on storage.objects for update
to authenticated
using ( bucket_id = 'property-images' AND owner = auth.uid() );

-- 5. Policy to allow users to delete their own images
create policy "Users can delete their own images"
on storage.objects for delete
to authenticated
using ( bucket_id = 'property-images' AND owner = auth.uid() );

-- 6. Add images column to datahouse table
alter table datahouse 
add column if not exists images text[] default '{}',
add column if not exists cover_image text;
