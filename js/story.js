import { supabase } from './supabase-init.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('id');

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

    // تم إزالة شرط eq('status', 'published') للسماح للأدمن بقراءة القصص المعلقة
    const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single(); 

    if (error || !data) {
        storyTitle.textContent = 'القصة غير موجودة أو قيد المراجعة.';
        storyContent.innerHTML = '';
        return;
    }

    document.title = data.title + " | منصة القصص"; 
    storyTitle.textContent = data.title;
    storyAuthor.textContent = `الكاتب: ${data.author_name}`;
    storyCategory.textContent = data.category;
    storyContent.innerHTML = data.content;
    storyImage.src = data.image_url;
    storyImage.style.display = 'block';
    storyMeta.style.display = 'flex';
    likeBtn.style.display = 'inline-block';

    let currentViews = data.views;
    let currentLikes = data.likes;

    storyViews.textContent = `👁️ ${currentViews}`;
    storyLikes.textContent = `❤️ ${currentLikes}`;

    const viewKey = `viewed_story_${storyId}`;
    if (!localStorage.getItem(viewKey)) {
        await supabase.rpc('increment_views', { story_id: storyId });
        localStorage.setItem(viewKey, 'true');
        currentViews++;
        storyViews.textContent = `👁️ ${currentViews}`;
    }

    const likeKey = `liked_story_${storyId}`;
    if (localStorage.getItem(likeKey)) {
        likeBtn.disabled = true;
        likeBtn.textContent = 'أعجبتك ❤️';
        likeBtn.style.opacity = '0.5';
        likeBtn.style.cursor = 'not-allowed';
    } else {
        likeBtn.addEventListener('click', async () => {
            likeBtn.disabled = true;
            likeBtn.textContent = 'جاري الإرسال...';
            const { error: likeError } = await supabase.rpc('increment_likes', { story_id: storyId });
            if (!likeError) {
                localStorage.setItem(likeKey, 'true');
                currentLikes++;
                storyLikes.textContent = `❤️ ${currentLikes}`;
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
