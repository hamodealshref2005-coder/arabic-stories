import { supabase } from './supabase-init.js';

document.addEventListener('DOMContentLoaded', async () => {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const editSection = document.getElementById('edit-section'); // قسم التعديل
    
    const loginForm = document.getElementById('admin-login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const loginMessage = document.getElementById('login-message');
    const storiesList = document.getElementById('admin-stories-list');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    const editForm = document.getElementById('edit-story-form'); // نموذج التعديل
    const cancelEditBtn = document.getElementById('cancel-edit-btn'); // زر الإلغاء

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
            
            // إضافة زري "قراءة" و "تعديل" لجميع القصص وفي كافة الأقسام
            let actionButtons = `
                <a href="story.html?id=${story.id}" target="_blank" class="btn-secondary" style="flex: 1; padding: 5px; font-size: 12px;">قراءة</a>
                <button class="btn-primary" style="flex: 1; padding: 5px; font-size: 12px; background-color: #2196F3; color: white;" onclick="openEditStory(${story.id})">تعديل</button>
            `;
            
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
        editSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        logoutBtn.style.display = 'inline-block';
        loadStories();
    }

    function showLogin() {
        loginSection.style.display = 'block';
        dashboardSection.style.display = 'none';
        editSection.style.display = 'none';
        logoutBtn.style.display = 'none';
    }

    // --- وظائف التعديل الجديدة ---

    // 1. فتح نافذة التعديل وجلب بيانات القصة
    window.openEditStory = async function(id) {
        dashboardSection.style.display = 'none';
        editSection.style.display = 'block';
        
        const { data, error } = await supabase.from('stories').select('*').eq('id', id).single();
        
        if (data) {
            document.getElementById('edit-id').value = data.id;
            document.getElementById('edit-title').value = data.title;
            document.getElementById('edit-author').value = data.author_name;
            document.getElementById('edit-category').value = data.category;
            // النص سيعرض بأكواد الـ HTML لكي تتمكن من رؤية وتعديل رابط الـ GIF
            document.getElementById('edit-content').value = data.content; 
        } else {
            alert('حدث خطأ في جلب بيانات القصة.');
            showDashboard();
        }
    };

    // 2. إلغاء التعديل والعودة للوحة
    cancelEditBtn.addEventListener('click', () => {
        showDashboard();
    });

    // 3. حفظ التعديلات وإرسالها لقاعدة البيانات
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = editForm.querySelector('button[type="submit"]');
        submitBtn.textContent = 'جاري الحفظ...';
        submitBtn.disabled = true;

        const id = document.getElementById('edit-id').value;
        const title = document.getElementById('edit-title').value;
        const author = document.getElementById('edit-author').value;
        const category = document.getElementById('edit-category').value;
        const content = document.getElementById('edit-content').value;

        const { error } = await supabase.from('stories').update({
            title: title,
            author_name: author,
            category: category,
            content: content
        }).eq('id', id);

        submitBtn.textContent = 'حفظ التعديلات';
        submitBtn.disabled = false;

        if (!error) {
            alert('تم حفظ التعديلات بنجاح!');
            showDashboard();
        } else {
            alert('حدث خطأ أثناء الحفظ.');
        }
    });

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
