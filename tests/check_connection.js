/**
 * TEST SCRIPTS - AEROREFUND AUTOMATED TESTING
 * 
 * Hướng dẫn: 
 * 1. Đảm bảo đã đổi DNS sang 8.8.8.8
 * 2. Chạy 'npm install' để cài đặt dependencies
 * 3. Chạy 'npm run dev' để khởi động server
 * 4. Chạy script này bằng lệnh: node ./tests/check_connection.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function checkSystem() {
    console.log('--- KIỂM TRA HỆ THỐNG AEROREFUND ---');
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Lỗi: Thiếu thông tin Supabase trong .env.local');
        return;
    }

    console.log(`🔗 URL: ${supabaseUrl}`);
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        console.log('⏳ Đang kết nối tới Database...');
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        
        if (error) {
            if (error.message.includes('getaddrinfo')) {
                console.error('❌ LỖI DNS: Không thể phân giải tên miền Supabase. Vui lòng đổi DNS sang 8.8.8.8');
            } else {
                console.error('❌ Lỗi DB:', error.message);
            }
        } else {
            console.log('✅ KẾT NỐI DATABASE: THÀNH CÔNG!');
        }

        console.log('⏳ Đang kiểm tra Auth (Signup Limit)...');
        const tempEmail = `test_${Math.floor(Math.random() * 1000)}@test.com`;
        const { error: authError } = await supabase.auth.signUp({
            email: tempEmail,
            password: 'temporary_password'
        });

        if (authError) {
            if (authError.status === 429) {
                console.warn('⚠️ CẢNH BÁO: Supabase đang giới hạn (Rate Limit). Bạn cần chờ 10-15 phút.');
            } else {
                console.error('❌ Lỗi Auth:', authError.message);
            }
        } else {
            console.log('✅ KHỞI TẠO AUTH: THÀNH CÔNG!');
        }

    } catch (err) {
        console.error('❌ Lỗi hệ thống:', err.message);
    }
}

checkSystem();
