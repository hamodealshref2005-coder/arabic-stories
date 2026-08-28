import { supabase } from './supabase-init.js';

document.addEventListener('DOMContentLoaded', async () => {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const editSection = document.getElementById('edit-section');
    
    const loginForm = document.getElementById('admin-login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const loginMessage = document.getElementById('login-message');
    const storiesList = document.getElementById('admin-stories-list');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    const editForm = document.getElementById('edit-story-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editContentBlocks = document.getElementById('edit-content-blocks');
    
    const addTextBtn = document.getElementById('admin-add-text-btn');
    const addGifBtn = document.getElementById('admin-add-gif-btn');

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

    // --- تفكيك القصة عند فتح التعديل ---
    window.openEditStory = async function(id) {
        dashboardSection.style.display = 'none';
        editSection.style.display = 'block';
        editContentBlocks.innerHTML = ''; // تفريغ الحاويات القديمة
        
        const { data, error } = await supabase.from('stories').select('*').eq('id', id).single();
        
        if (data) {
            document.getElementById('edit-id').value = data.id;
            document.getElementById('edit-title').value = data.title;
            document.getElementById('edit-author').value = data.author_name;
            document.getElementById('edit-category').value = data.category;
            
            // تحويل النص المخزن (HTML) إلى عناصر مؤقتة لتفكيكها
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data.content;
            
            Array.from(tempDiv.children).forEach(child => {
                if (child.tagName === 'P') {
                    // إنشاء حاوية نص
                    const textArea = document.createElement('textarea');
                    textArea.className = 'story-block text-block';
                    textArea.rows = 4;
                    // إرجاع الفواصل السطرية
                    textArea.value = child.innerHTML.replace(/<br\s*[\/]?>/gi, '\n');
                    textArea.style.cssText = 'width: 100%; padding: 12px; margin-bottom: 10px; background-color: var(--bg-color); border: 1px solid #333; color: white; border-radius: 8px; outline: none;';
                    editContentBlocks.appendChild(textArea);
                } else if (child.tagName === 'IMG') {
                    // إنشاء حاوية رابط GIF
                    const input = document.createElement('input');
                    input.type = 'url';
                    input.className = 'story-block gif-block';
                    input.value = child.src;
                    input.style.cssText = 'width: 100%; padding: 12px; margin-bottom: 10px; background-color: var(--bg-color); border: 1px solid #ff9800; color: white; border-radius: 8px; direction: ltr; text-align: left; outline: none;';
                    editContentBlocks.appendChild(input);
                }
            });
            
            // إضافة مربع نص فارغ إذا كانت القصة فارغة
            if (editContentBlocks.innerHTML === '') addTextBlock();

        } else {
            alert('حدث خطأ في جلب بيانات القصة.');
            showDashboard();
        }
    };

    // دوال إضافة حاويات جديدة أثناء التعديل
    function addTextBlock() {
        const textArea = document.createElement('textarea');
        textArea.className = 'story-block text-block';
        textArea.rows = 4;
        textArea.placeholder = 'اكتب فقرة إضافية هنا...';
        textArea.style.cssText = 'width: 100%; padding: 12px; margin-bottom: 10px; background-color: var(--bg-color); border: 1px solid #333; color: white; border-radius: 8px; outline: none;';
        editContentBlocks.appendChild(textArea);
    }

    function addGifBlock() {
        const input = document.createElement('input');
        input.type = 'url';
        input.className = 'story-block gif-block';
        input.placeholder = 'رابط الصورة المتحركة (GIF)...';
        input.style.cssText = 'width: 100%; padding: 12px; margin-bottom: 10px; background-color: var(--bg-color); border: 1px solid #ff9800; color: white; border-radius: 8px; direction: ltr; text-align: left; outline: none;';
        editContentBlocks.appendChild(input);
    }

    addTextBtn.addEventListener('click', addTextBlock);
    addGifBtn.addEventListener('click', addGifBlock);

    cancelEditBtn.addEventListener('click', () => {
        showDashboard();
    });

    // --- إعادة تجميع القصة عند الحفظ ---
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = editForm.querySelector('button[type="submit"]');
        submitBtn.textContent = 'جاري الحفظ...';
        submitBtn.disabled = true;

        const id = document.getElementById('edit-id').value;
        const title = document.getElementById('edit-title').value;
        const author = document.getElementById('edit-author').value;
        const category = document.getElementById('edit-category').value;
        
        let finalContent = '';
        const blocks = editContentBlocks.querySelectorAll('.story-block');
        
        blocks.forEach(block => {
            if (block.classList.contains('text-block') && block.value.trim() !== '') {
                finalContent += `<p style="margin-bottom: 20px;">${block.value.replace(/\n/g, '<br>')}</p>`;
            } else if (block.classList.contains('gif-block') && block.value.trim() !== '') {
                finalContent += `<img src="${block.value.trim()}" alt="صورة متحركة" style="max-width: 100%; border-radius: 12px; margin: 20px auto; display: block;">`;
            }
        });

        const { error } = await supabase.from('stories').update({
            title: title,
            author_name: author,
            category: category,
            content: finalContent
        }).eq('id', id);

        submitBtn.textContent = 'حفظ التعديلات والنشر';
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
