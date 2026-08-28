import { supabase } from './supabase-init.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. جلب القصص المنشورة فقط من قاعدة البيانات
    const { data: stories, error } = await supabase
        .from('stories')
        .select('*')
        .eq('status', 'published');

    if (error) {
        console.error('خطأ في جلب القصص:', error);
        return;
    }

    if (!stories || stories.length === 0) {
        document.getElementById('featured').innerHTML = '<p style="text-align:center;">لا توجد قصص منشورة بعد.</p>';
        document.querySelector('#most-viewed .stories-grid').innerHTML = '';
        document.querySelector('#latest .stories-grid').innerHTML = '';
        return;
    }

    // 2. ترتيب القصص وتوزيعها
    // أحدث القصص (ترتيب حسب تاريخ الإنشاء)
    const latestStories = [...stories].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // الأكثر مشاهدة (ترتيب حسب المشاهدات)
    const mostViewedStories = [...stories].sort((a, b) => b.views - a.views);
    
    // القصة المميزة (سنختار القصة الأعلى مشاهدة لتكون المميزة)
    const featuredStory = mostViewedStories[0];
    // باقي القصص للأكثر مشاهدة (نستبعد القصة المميزة حتى لا تتكرر)
    const topStories = mostViewedStories.slice(1, 4); 

    // 3. دالة لإنشاء بطاقة القصة (كود HTML للبطاقة)
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
                    <!-- رابط الذهاب لصفحة قراءة القصة مع إرسال الـ ID -->
                    <a href="story.html?id=${story.id}" class="btn-primary" style="margin-top: 15px; text-align: center; display: block;">اقرأ الآن</a>
                </div>
            </div>
        `;
    }

    // 4. عرض القصة المميزة
    const featuredSection = document.getElementById('featured');
    featuredSection.innerHTML = `
        <div class="featured-card">
            <img src="${featuredStory.image_url}" alt="${featuredStory.title}" class="featured-img">
            <div class="featured-content">
                <h2>${featuredStory.title}</h2>
                <p>بواسطة: ${featuredStory.author_name} | التصنيف: ${featuredStory.category}</p>
                <a href="story.html?id=${featuredStory.id}" class="btn-secondary">اقرأ الآن</a>
            </div>
        </div>
    `;

    // 5. عرض أحدث القصص (عرض أول 3 قصص كحد أقصى)
    const latestContainer = document.querySelector('#latest .stories-grid');
    latestContainer.innerHTML = latestStories.slice(0, 3).map(createStoryCard).join('');

    // 6. عرض الأكثر مشاهدة
    const mostViewedContainer = document.querySelector('#most-viewed .stories-grid');
    if (topStories.length > 0) {
        mostViewedContainer.innerHTML = topStories.map(createStoryCard).join('');
    } else {
        mostViewedContainer.innerHTML = '<p>لا توجد قصص أخرى حالياً.</p>';
    }
});
