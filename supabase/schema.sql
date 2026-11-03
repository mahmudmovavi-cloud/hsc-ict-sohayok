-- HSC ICT সহায়ক: বিগত সালের প্রশ্নের টেবিল
create table if not exists public.past_questions (
  id           bigserial primary key,
  year         int  not null check (year between 2000 and 2100),
  board        text not null,
  qno          int  not null,
  question     text not null,
  options      jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  answer       int  not null check (answer between 0 and 3),
  explanation  text,
  note         text,
  ai_answer    boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (year, board, qno)
);

alter table public.past_questions enable row level security;

-- সবাই (anon) শুধু পড়তে পারবে। যোগ/মোছা শুধু Supabase ড্যাশবোর্ড বা service key দিয়ে।
drop policy if exists "public read past questions" on public.past_questions;
create policy "public read past questions" on public.past_questions
  for select to anon, authenticated using (true);
