// استيراد الاتصال بقاعدة البيانات
import { supabase } from './supabase-init.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('create-story-form');
    const submitBtn = document.getElementById('submit-btn');
    const messageBox = document.getElementById('message-box');

    // التأكد من وجود النموذج في الصفحة لتجنب الأخطاء
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        // منع إعادة تحميل الصفحة عند الضغط على إرسال
        e.preventDefault();

        // تعطيل الزر أثناء الإرسال لمنع التكرار
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري الإرسال ورفع الصورة...';
        messageBox.innerHTML = ''; 

        try {
            // 1. جلب القيم من الحقول
            const title = document.getElementById('title').value;
            const author = document.getElementById('author').value;
            const category = document.getElementById('category').value;
            const content = document.getElementById('content').value;
            const imageFile = document.getElementById('image').files[0];

            if (!imageFile) {
                throw new Error('الرجاء اختيار صورة للقصة.');
            }

            // 2. رفع الصورة إلى Supabase Storage
            // إنشاء اسم فريد للصورة لتجنب استبدال الصور المتشابهة في الاسم
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `public/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('story-images')
                .upload(filePath, imageFile);

            if (uploadError) {
                console.error("Upload Error:", uploadError);
                throw new Error('حدث خطأ أثناء رفع الصورة. تأكد من حجمها وأنها بصيغة صحيحة.');
            }

            // 3. الحصول على الرابط العام للصورة بعد رفعها
            const { data: publicUrlData } = supabase.storage
                .from('story-images')
                .getPublicUrl(filePath);
            
            const imageUrl = publicUrlData.publicUrl;

            // 4. حفظ بيانات القصة في قاعدة البيانات
            // ملاحظة: لم نرسل الـ status لأننا برمجنا قاعدة البيانات لتجعله pending افتراضياً
            const { data: insertData, error: insertError } = await supabase
                .from('stories')
                .insert([
                    {
                        title: title,
                        author_name: author,
                        category: category,
                        content: content,
                        image_url: imageUrl
                    }
                ]);

            if (insertError) {
                console.error("Insert Error:", insertError);
                throw new Error('حدث خطأ أثناء حفظ بيانات القصة.');
            }

            // 5. نجاح العملية
            messageBox.innerHTML = '<p style="color: var(--primary-color); font-weight: bold; margin-top: 15px; padding: 10px; background: rgba(255, 152, 0, 0.1); border-radius: 8px;">تم إرسال قصتك بنجاح! ستظهر في الموقع فور مراجعتها من قبل الإدارة.</p>';
            form.reset(); // تفريغ الحقول

        } catch (error) {
            // عرض رسالة الخطأ للمستخدم
            messageBox.innerHTML = `<p style="color: #f44336; font-weight: bold; margin-top: 15px;">خطأ: ${error.message}</p>`;
        } finally {
            // إعادة تفعيل الزر
            submitBtn.disabled = false;
            submitBtn.textContent = 'إرسال القصة للمراجعة';
        }
    });
});
