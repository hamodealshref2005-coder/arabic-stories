import { supabase } from './supabase-init.js';

document.addEventListener('DOMContentLoaded', async () => {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('admin-login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const loginMessage = document.getElementById('login-message');
    const storiesList = document.getElementById('admin-stories-list');
    const tabBtns = document.querySelectorAll('.tab-btn');

    let currentStatus = 'pending';

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        showDashboard();
    } else {
        showLogin();
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginMessage.innerHTML = 'جاري تسجيل الدخول...';
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });

        if (error) {
            loginMessage.innerHTML = `<p style="color: #f44336; margin-top:10px;">خطأ: البريد أو كلمة المرور غير صحيحة.</p>`;
        } else {
            loginMessage.innerHTML = '';
            showDashboard();
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        showLogin();
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentStatus = e.target.getAttribute('data-status');
            loadStories();
        });
    });

    async function loadStories() {
        storiesList.innerHTML = '<p>جاري تحميل القصص...</p>';
        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('status', currentStatus)
            .order('created_at', { ascending: false });

        if (error) {
            storiesList.innerHTML = '<p style="color: red;">حدث خطأ أثناء جلب القصص.</p>';
            return;
        }
        if (data.length === 0) {
            storiesList.innerHTML = '<p>لا توجد قصص في هذا القسم حالياً.</p>';
            return;
        }

        storiesList.innerHTML = '';
        data.forEach(story => {
            const card = document.createElement('div');
            card.className = 'story-card';
            
            // إضافة زر "قراءة" لجميع الحالات
            let actionButtons = `<a href="story.html?id=${story.id}" target="_blank" class="btn-secondary" style="flex: 1; padding: 5px; font-size: 12px;">قراءة</a>`;
            
            if (currentStatus === 'pending') {
                actionButtons += `
                    <button class="btn-accept" style="flex: 1;" onclick="updateStoryStatus(${story.id}, 'published')">قبول</button>
                    <button class="btn-reject" style="flex: 1;" onclick="updateStoryStatus(${story.id}, 'rejected')">رفض</button>
                `;
            } else if (currentStatus === 'published') {
                actionButtons += `<button class="btn-reject" style="flex: 2;" onclick="updateStoryStatus(${story.id}, 'rejected')">إلغاء النشر</button>`;
            } else if (currentStatus === 'rejected') {
                actionButtons += `<button class="btn-accept" style="flex: 2;" onclick="updateStoryStatus(${story.id}, 'published')">نشر</button>`;
            }

            actionButtons += `<button class="btn-delete" style="flex: 1;" onclick="deleteStory(${story.id})">حذف</button>`;

            card.innerHTML = `
                <img src="${story.image_url}" alt="${story.title}">
                <div class="story-info">
                    <span class="category">${story.category}</span>
                    <h3>${story.title}</h3>
                    <span class="author">الكاتب: ${story.author_name}</span>
                    <div class="admin-actions" style="flex-wrap: wrap;">
                        ${actionButtons}
                    </div>
                </div>
            `;
            storiesList.appendChild(card);
        });
    }

    function showDashboard() {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        logoutBtn.style.display = 'inline-block';
        loadStories();
    }

    function showLogin() {
        loginSection.style.display = 'block';
        dashboardSection.style.display = 'none';
        logoutBtn.style.display = 'none';
    }

    window.updateStoryStatus = async function(id, newStatus) {
        if(!confirm('هل أنت متأكد من تغيير حالة القصة؟')) return;
        const { error } = await supabase.from('stories').update({ status: newStatus }).eq('id', id);
        if (!error) loadStories();
        else alert('حدث خطأ أثناء التعديل');
    };

    window.deleteStory = async function(id) {
        if(!confirm('هل أنت متأكد من حذف القصة نهائياً؟')) return;
        const { error } = await supabase.from('stories').delete().eq('id', id);
        if (!error) loadStories();
        else alert('حدث خطأ أثناء الحذف');
    };
});
