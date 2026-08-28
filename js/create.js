import { supabase } from './supabase-init.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('create-story-form');
    const submitBtn = document.getElementById('submit-btn');
    
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    
    const addGifBtn = document.getElementById('add-gif-btn');
    const contentBlocks = document.getElementById('content-blocks');
    const successOverlay = document.getElementById('success-overlay');

    if (!form) return;

    // التنقل للجزء الثاني
    nextBtn.addEventListener('click', () => {
        const title = document.getElementById('title').value;
        const author = document.getElementById('author').value;
        const category = document.getElementById('category').value;
        const imageFile = document.getElementById('image').files[0];

        if(!title || !author || !category || !imageFile) {
            alert('الرجاء ملء جميع البيانات واختيار صورة الغلاف للانتقال للخطوة التالية.');
            return;
        }

        step1.style.display = 'none';
        step2.style.display = 'block';
    });

    // العودة للجزء الأول
    prevBtn.addEventListener('click', () => {
        step2.style.display = 'none';
        step1.style.display = 'block';
    });

    // إضافة حقل صورة متحركة جديد + حقل نص بعده
    addGifBtn.addEventListener('click', () => {
        // إنشاء حقل الرابط
        const gifInput = document.createElement('input');
        gifInput.type = 'url';
        gifInput.className = 'story-block gif-block';
        gifInput.placeholder = 'ضع رابط الصورة المتحركة (GIF) هنا...';
        gifInput.style.width = '100%';
        gifInput.style.padding = '12px';
        gifInput.style.marginTop = '15px';
        gifInput.style.backgroundColor = 'var(--bg-color)';
        gifInput.style.border = '1px solid #ff9800';
        gifInput.style.color = 'white';
        gifInput.style.borderRadius = '8px';

        // إنشاء حقل نص إضافي لاستكمال القصة
        const newTextArea = document.createElement('textarea');
        newTextArea.className = 'story-block text-block';
        newTextArea.rows = 4;
        newTextArea.placeholder = 'أكمل كتابة القصة تحت الصورة...';
        newTextArea.style.width = '100%';
        newTextArea.style.padding = '12px';
        newTextArea.style.marginTop = '15px';
        newTextArea.style.backgroundColor = 'var(--bg-color)';
        newTextArea.style.border = '1px solid #333';
        newTextArea.style.color = 'white';
        newTextArea.style.borderRadius = '8px';

        contentBlocks.appendChild(gifInput);
        contentBlocks.appendChild(newTextArea);
    });

    // إرسال البيانات
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري المعالجة والرفع...';

        try {
            const title = document.getElementById('title').value;
            const author = document.getElementById('author').value;
            const category = document.getElementById('category').value;
            const imageFile = document.getElementById('image').files[0];

            // 1. تجميع محتوى القصة (النصوص + الصور المتحركة) في كود HTML واحد
            let finalContent = '';
            const blocks = contentBlocks.querySelectorAll('.story-block');
            
            blocks.forEach(block => {
                if (block.classList.contains('text-block') && block.value.trim() !== '') {
                    // تحويل السطور لـ <br> لضمان التنسيق
                    finalContent += `<p style="margin-bottom: 20px;">${block.value.replace(/\n/g, '<br>')}</p>`;
                } else if (block.classList.contains('gif-block') && block.value.trim() !== '') {
                    // تحويل الرابط لصورة
                    finalContent += `<img src="${block.value.trim()}" alt="صورة متحركة" style="max-width: 100%; border-radius: 12px; margin: 20px auto; display: block;">`;
                }
            });

            if (finalContent === '') throw new Error('الرجاء كتابة نص القصة.');

            // 2. رفع صورة الغلاف
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `public/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('story-images')
                .upload(filePath, imageFile);
            if (uploadError) throw new Error('خطأ في رفع صورة الغلاف.');

            const { data: publicUrlData } = supabase.storage
                .from('story-images')
                .getPublicUrl(filePath);
            const imageUrl = publicUrlData.publicUrl;

            // 3. الحفظ في قاعدة البيانات
            const { error: insertError } = await supabase
                .from('stories')
                .insert([{
                    title: title,
                    author_name: author,
                    category: category,
                    content: finalContent, // هنا نحفظ الـ HTML المدمج
                    image_url: imageUrl
                }]);

            if (insertError) throw new Error('حدث خطأ أثناء إرسال القصة.');

            // 4. إظهار رسالة النجاح المنبثقة والتحويل
            successOverlay.style.display = 'flex';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000); // التحويل بعد 3 ثواني

        } catch (error) {
            alert(`خطأ: ${error.message}`);
            submitBtn.disabled = false;
            submitBtn.textContent = 'إرسال القصة للمراجعة';
        }
    });
});
