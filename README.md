# HSC ICT সহায়ক: GitHub + Vercel + Supabase দিয়ে প্রকাশ

প্রজেক্টের গঠন
- `public/index.html` : পুরো অ্যাপ (চ্যাট, কনভার্টার, HTML ও প্রোগ্রামিং ল্যাব, কুইজ, বিগত সালের প্রশ্ন)
- `public/config.js` : Supabase-এর URL ও anon key বসানোর ফাইল
- `api/ai.js` : Vercel ফাংশন। এআই চ্যাট ও কোড ব্যাখ্যা এর মাধ্যমে Google Gemini API-তে যায়
- `supabase/schema.sql`, `supabase/seed.sql` : বিগত সালের প্রশ্নের টেবিল ও ২০২৬ সালের ২৫টি প্রশ্ন

## ধাপ ১: GitHub
1. github.com-এ নতুন রিপোজিটরি বানাও (যেমন `hsc-ict-sohayok`)।
2. এই ফোল্ডারে টার্মিনাল খুলে:
```
git init
git add .
git commit -m "HSC ICT সহায়ক"
git branch -M main
git remote add origin https://github.com/<তোমার-ইউজারনেম>/hsc-ict-sohayok.git
git push -u origin main
```

## ধাপ ২: Supabase
1. supabase.com-এ নতুন প্রজেক্ট বানাও।
2. বাঁ মেনুর SQL Editor খুলে `supabase/schema.sql` পুরোটা পেস্ট করে Run দাও। তারপর `supabase/seed.sql` পেস্ট করে Run দাও।
3. Project Settings > API থেকে **Project URL** ও **anon public key** কপি করো।
4. `public/config.js`-এ দুটি মান বসিয়ে সেভ করো এবং আবার `git commit` ও `git push` করো।
   (anon key পাবলিক থাকলে সমস্যা নেই, কারণ টেবিলে শুধু পড়ার অনুমতি আছে। service_role key কখনো কোডে বসাবে না।)
5. পরে নতুন বছরের প্রশ্ন যোগ করতে Table Editor > past_questions-এ সারি যোগ করো। অ্যাপে নিজে থেকে দেখাবে।

## ধাপ ৩: Vercel
1. vercel.com-এ GitHub দিয়ে লগইন করে **Add New > Project** চাপো এবং রিপোজিটরিটি Import করো।
2. Framework Preset: **Other**। Build Command ও Output Directory ফাঁকা রাখলেও চলবে (`vercel.json` থেকে নেবে)।
3. **Environment Variables** যোগ করো:
   - `GEMINI_API_KEY` = aistudio.google.com/apikey থেকে নেওয়া API key
   - `GEMINI_MODEL` = ঐচ্ছিক (ডিফল্ট `gemini-2.5-flash`)
   - `ALLOWED_ORIGIN` = ঐচ্ছিক, তোমার সাইটের ঠিকানা (যেমন `https://hsc-ict-sohayok.vercel.app`)
4. Deploy চাপো। শেষ হলে সাইটের লিংক পাবে।

## সতর্কতা
- AI Studio-র ফ্রি টিয়ারে প্রতি মিনিট ও প্রতিদিনের অনুরোধের সীমা আছে। সীমা পেরোলে সাইটে "অনেক বেশি অনুরোধ" বার্তা আসবে। বেশি ব্যবহার হলে Google Cloud-এ বিলিং চালু করতে হতে পারে, তখন খরচের সীমা ঠিক করে নিয়ো।
- `api/ai.js`-এ প্রতি IP-র জন্য ১০ মিনিটে ২০ অনুরোধের সহজ সীমা আছে। বেশি ব্যবহারকারী হলে Supabase Auth দিয়ে লগইন বাধ্যতামূলক করা ভালো।
- `.env` ফাইল বা API key কখনো GitHub-এ তুলবে না।
