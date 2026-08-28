import { supabase } from './supabase-init.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { data: stories, error } = await supabase
        .from('stories')
        .select('*')
        .eq('status', 'published');

    if (error || !stories || stories.length === 0) {
        document.querySelector('#most-viewed .stories-grid').innerHTML = '<p>لا توجد قصص.</p>';
        document.querySelector('#latest .stories-grid').innerHTML = '';
        document.getElementById('all-stories-container').innerHTML = '';
        return;
    }

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

    const mostViewedContainer = document.querySelector('#most-viewed .stories-grid');
    const latestContainer = document.querySelector('#latest .stories-grid');
    const allStoriesContainer = document.getElementById('all-stories-container');
    
    const btnMostViewed = document.getElementById('toggle-most-viewed');
    const btnLatest = document.getElementById('toggle-latest');

    let mostViewedExpanded = false;
    let latestExpanded = false;

    function renderMostViewed() {
        if(mostViewedExpanded) {
            mostViewedContainer.innerHTML = mostViewedStories.map(createStoryCard).join('');
            mostViewedContainer.classList.add('expanded-grid');
            btnMostViewed.textContent = 'إخفاء';
        } else {
            mostViewedContainer.innerHTML = mostViewedStories.slice(0, 5).map(createStoryCard).join('');
            mostViewedContainer.classList.remove('expanded-grid');
            btnMostViewed.textContent = 'عرض الكل';
        }
    }

    function renderLatest() {
        if(latestExpanded) {
            latestContainer.innerHTML = latestStories.map(createStoryCard).join('');
            latestContainer.classList.add('expanded-grid');
            btnLatest.textContent = 'إخفاء';
        } else {
            latestContainer.innerHTML = latestStories.slice(0, 5).map(createStoryCard).join('');
            latestContainer.classList.remove('expanded-grid');
            btnLatest.textContent = 'عرض الكل';
        }
    }

    btnMostViewed.addEventListener('click', () => {
        mostViewedExpanded = !mostViewedExpanded;
        renderMostViewed();
    });

    btnLatest.addEventListener('click', () => {
        latestExpanded = !latestExpanded;
        renderLatest();
    });

    // العرض الافتراضي
    renderMostViewed();
    renderLatest();
    
    if(allStoriesContainer) {
        allStoriesContainer.innerHTML = latestStories.map(createStoryCard).join('');
    }
});
