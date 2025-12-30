-- Create a new private bucket 'apps'
insert into storage.buckets (id, name, public)
values ('apps', 'apps', true)
on conflict (id) do nothing;

-- Allow public access to read files
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'apps' );

-- Allow authenticated users (admins) to upload files
create policy "Admin Upload Access"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'apps' );

-- Allow authenticated users (admins) to update files
create policy "Admin Update Access"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'apps' );

-- Allow authenticated users (admins) to delete files
create policy "Admin Delete Access"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'apps' );
