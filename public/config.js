// Supabase Project Settings > API থেকে এই দুটি মান বসাও।
// anon key পাবলিক থাকলে সমস্যা নেই, কারণ টেবিলে শুধু পড়ার অনুমতি (RLS) আছে।
// খালি রাখলে অ্যাপ নিজের ভেতরের প্রশ্ন দেখাবে।
window.APP_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: ""
};
