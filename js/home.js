import { supabase } from './supabase-init.js';

document.addEventListener('DOMContentLoaded', async () => {
    // جلب القصص المنشورة
    const { data: stories, error } = await supabase
        .from('stories')
        .select('*')
        .eq('status', 'published');

    if (error) {
        console.error('خطأ في جلب القصص:', error);
        return;
    }

    if (!stories || stories.length === 0) {
        document.querySelector('#most-viewed .stories-grid').innerHTML = '<p>لا توجد قصص.</p>';
        document.querySelector('#latest .stories-grid').innerHTML = '';
        document.getElementById('all-stories-container').innerHTML = '';
        return;
    }

    // الترتيب
    const latestStories = [...stories].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const mostViewedStories = [...stories].sort((a, b) => b.views - a.views);

    function createStoryCard(story) {
        return `
            <div class="story-card">
                <img src="${story.image_url}" alt="${story.title}">
                <div class="story-info">
                    <span class="category">${story.category}</span>
                    <h3>${story.title}</h3>
                    <span class="author">بواسطة: ${story.author_name}</span>
                    <div class="stats">
                        <span>👁️ ${story.views}</span>
                        <span>❤️ ${story.likes}</span>
                    </div>
                    <a href="story.html?id=${story.id}" class="btn-primary" style="margin-top: 15px; text-align: center; display: block;">اقرأ الآن</a>
                </div>
            </div>
        `;
    }

    // عرض أعلى 5 قصص مشاهدة في التمرير الجانبي
    document.querySelector('#most-viewed .stories-grid').innerHTML = mostViewedStories.slice(0, 5).map(createStoryCard).join('');
    
    // عرض أحدث 5 قصص في التمرير الجانبي
    document.querySelector('#latest .stories-grid').innerHTML = latestStories.slice(0, 5).map(createStoryCard).join('');

    // عرض جميع القصص في قسم "كل القصص" السفلي
    document.getElementById('all-stories-container').innerHTML = latestStories.map(createStoryCard).join('');
});
