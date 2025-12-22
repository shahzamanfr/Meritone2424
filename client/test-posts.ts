// Quick test to check if posts exist in database
import { supabase } from './lib/supabase';

async function testPosts() {
    console.log('Testing database connection...');

    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error fetching posts:', error);
    } else {
        console.log('Posts found:', data?.length || 0);
        console.log('Posts:', data);
    }
}

testPosts();
