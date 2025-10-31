import 'dotenv/config';

export default {
  expo: {
    name: 'Maintainly',
    slug: 'maintainly',
    scheme: 'maintainly',
    plugins: [],
    extra: {
      supabase: {
        url: process.env.EXPO_PUBLIC_SUPABASE_URL,
        anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      },
    },
  },
};
