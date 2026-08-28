import { supabase } from './supabase-init.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. استخراج رقم القصة (ID) من الرابط المتواجد في المتصفح
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('id');

    // إذا تم فتح الصفحة بدون رابط قصة، يتم تحويل الزائر للرئيسية
    if (!storyId) {
        window.location.href = 'index.html';
        return;
    }

    const storyTitle = document.getElementById('story-title');
    const storyImage = document.getElementById('story-image');
    const storyAuthor = document.getElementById('story-author');
    const storyCategory = document.getElementById('story-category');
    const storyViews = document.getElementById('story-views');
    const storyLikes = document.getElementById('story-likes');
    const storyContent = document.getElementById('story-content');
    const likeBtn = document.getElementById('like-btn');
    const storyMeta = document.getElementById('story-meta');

    // 2. جلب بيانات القصة من قاعدة البيانات
    const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .eq('status', 'published')
        .single(); // دالة single لجلب صف واحد فقط

    if (error || !data) {
        storyTitle.textContent = 'القصة غير موجودة أو تم حذفها.';
        storyContent.innerHTML = '';
        return;
    }

    // 3. عرض البيانات في الصفحة بعد نجاح الجلب
    document.title = data.title + " | منصة القصص"; // تغيير عنوان المتصفح
    storyTitle.textContent = data.title;
    storyAuthor.textContent = `الكاتب: ${data.author_name}`;
    storyCategory.textContent = data.category;
    storyContent.textContent = data.content;
    
    storyImage.src = data.image_url;
    
    // إظهار العناصر المخفية
    storyImage.style.display = 'block';
    storyMeta.style.display = 'flex';
    likeBtn.style.display = 'inline-block';

    let currentViews = data.views;
    let currentLikes = data.likes;

    storyViews.textContent = `👁️ ${currentViews}`;
    storyLikes.textContent = `❤️ ${currentLikes}`;

    // 4. نظام المشاهدات لمنع التكرار الوهمي (باستخدام LocalStorage)
    const viewKey = `viewed_story_${storyId}`;
    
    if (!localStorage.getItem(viewKey)) {
        // إذا لم يشاهدها مسبقاً، استدعِ دالة الزيادة في Supabase
        await supabase.rpc('increment_views', { story_id: storyId });
        
        // احفظ الزيارة في متصفح الزائر لمنعه من الزيادة عند تحديث الصفحة
        localStorage.setItem(viewKey, 'true');
        
        // تحديث الرقم الظاهر فوراً ليراه الزائر
        currentViews++;
        storyViews.textContent = `👁️ ${currentViews}`;
    }

    // 5. نظام الإعجابات
    const likeKey = `liked_story_${storyId}`;
    
    // إذا كان الزائر قد أعجب بالقصة مسبقاً
    if (localStorage.getItem(likeKey)) {
        likeBtn.disabled = true;
        likeBtn.textContent = 'أعجبتك ❤️';
        likeBtn.style.opacity = '0.5';
        likeBtn.style.cursor = 'not-allowed';
    } else {
        // إذا لم يعجب بها، يتم تفعيل الزر للضغط
        likeBtn.addEventListener('click', async () => {
            likeBtn.disabled = true;
            likeBtn.textContent = 'جاري الإرسال...';
            
            // استدعاء دالة زيادة الإعجاب في Supabase
            const { error: likeError } = await supabase.rpc('increment_likes', { story_id: storyId });
            
            if (!likeError) {
                // حفظ الإعجاب في متصفح الزائر
                localStorage.setItem(likeKey, 'true');
                currentLikes++;
                storyLikes.textContent = `❤️ ${currentLikes}`;
                
                // تغيير شكل الزر بعد نجاح الإعجاب
                likeBtn.textContent = 'أعجبتك ❤️';
                likeBtn.style.opacity = '0.5';
                likeBtn.style.cursor = 'not-allowed';
            } else {
                likeBtn.disabled = false;
                likeBtn.textContent = 'أعجبتني ❤️';
                alert('حدث خطأ أثناء تسجيل الإعجاب.');
            }
        });
    }
});
