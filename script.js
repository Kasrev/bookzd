let books = [], currentCover = '', editCover = '', editingIndex = -1, currentRating = 0, editRating = 0, sidebarOpen = true;

function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    document.getElementById('sidebar').classList.toggle('collapsed', !sidebarOpen);
}

document.addEventListener('DOMContentLoaded', function() {
    loadData();
    loadUser();
    initStarRatings();
    renderLibrary();
});

function loadData() { books = JSON.parse(localStorage.getItem('books')) || []; }
function saveData() { localStorage.setItem('books', JSON.stringify(books)); }

function loadUser() {
    var user = JSON.parse(localStorage.getItem('user')) || { name: 'Kullanıcı', avatar: '' };
    var nameEl = document.getElementById('userName');
    var avatarEl = document.getElementById('userAvatar');
    if (nameEl) nameEl.textContent = user.name;
    if (avatarEl && user.avatar) avatarEl.src = user.avatar;
}

window.addEventListener('storage', function(e) {
    if (e.key === 'user') loadUser();
});

function editProfile() {
    var user = JSON.parse(localStorage.getItem('user')) || { name: 'Kullanıcı', avatar: '' };
    var newName = prompt('Adınız:', user.name);
    if (newName !== null && newName.trim()) {
        user.name = newName.trim();
        localStorage.setItem('user', JSON.stringify(user));
        loadUser();
    }
}

function initStarRatings() {
    initStarRating('addStars', 'addRatingDisplay', function(val) { currentRating = val; });
    initStarRating('editStars', 'editRatingDisplay', function(val) { editRating = val; });
}

function initStarRating(starsId, displayId, callback) {
    var container = document.getElementById(starsId);
    if (!container) return;
    var stars = container.querySelectorAll('.star');
    var display = document.getElementById(displayId);
    stars.forEach(function(star, index) {
        star.addEventListener('click', function() {
            callback(index + 1);
            updateStarDisplay(stars, index + 1);
            if (display) display.textContent = (index + 1).toString();
        });
    });
}

function updateStarDisplay(stars, rating) {
    stars.forEach(function(star, index) {
        star.classList.toggle('filled', index < rating);
    });
}

function getStars(rating) {
    if (!rating) return '';
    return '●'.repeat(rating);
}

function renderLibrary() {
    var container = document.getElementById('libraryList');
    if (!container) return;
    var empty = document.getElementById('emptyLibrary');
    
    var completedBooks = books.filter(function(b) { return b.status === 'completed'; });
    var readingBooks = books.filter(function(b) { return b.status === 'reading'; });
    var toReadBooks = books.filter(function(b) { return b.status === 'to-read'; });
    
    var totalPages = books.reduce(function(sum, b) { return sum + (parseInt(b.pages) || 0); }, 0);
    
    document.getElementById('libCompleted').textContent = completedBooks.length;
    document.getElementById('libReading').textContent = readingBooks.length;
    document.getElementById('libHold').textContent = books.filter(function(b) { return b.status === 'on-hold'; }).length;
    document.getElementById('libToRead').textContent = toReadBooks.length;
    document.getElementById('libTotalPages').textContent = totalPages;
    
    var filtered = books.slice();
    
    var searchQuery = document.getElementById('searchInput');
    if (searchQuery && searchQuery.value.trim()) {
        var q = searchQuery.value.toLowerCase();
        filtered = filtered.filter(function(b) { 
            return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q); 
        });
    }
    
    if (window.currentFilter !== 'all' && window.currentFilter) {
        filtered = filtered.filter(function(b) { return b.status === window.currentFilter; });
    }
    
    var sortVal = document.getElementById('sortSelect');
    if (sortVal) {
        switch(sortVal.value) {
            case 'date-desc': filtered.sort(function(a, b) { return new Date(b.date) - new Date(a.date); }); break;
            case 'date-asc': filtered.sort(function(a, b) { return new Date(a.date) - new Date(b.date); }); break;
            case 'title-asc': filtered.sort(function(a, b) { return a.title.localeCompare(b.title, 'tr'); }); break;
            case 'rating-desc': filtered.sort(function(a, b) { return (b.rating || 0) - (a.rating || 0); }); break;
        }
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    
    if (empty) empty.style.display = 'none';
    
    var statusMap = { completed: 'Okundu', reading: 'Okunuyor', 'on-hold': 'Beklemede', 'to-read': 'Okunacaklar' };
    
    container.innerHTML = filtered.map(function(book) {
        var idx = books.indexOf(book);
        var progressHtml = '';
        if ((book.status === 'reading' || book.status === 'to-read') && book.pages > 0) {
            var pct = Math.min(100, Math.round((book.currentPage || 0) / book.pages * 100));
            progressHtml = '<div class="book-progress"><div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div><span class="progress-text">' + (book.currentPage || 0) + '/' + book.pages + '</span></div>';
        }
        return '<div class="book-card" onclick="showDetailModal(' + idx + ')">' +
            '<div class="book-cover">' +
            (book.cover ? '<img src="' + book.cover + '" alt="' + book.title + '">' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>') +
            '<span class="book-status status-' + book.status + '">' + statusMap[book.status] + '</span></div>' +
            '<div class="book-info"><div class="book-title">' + book.title + '</div>' +
            '<div class="book-author">' + book.author + '</div>' +
            (book.rating ? '<div class="book-rating">' + getStars(book.rating) + '</div>' : '') +
            progressHtml +
            '</div></div>';
    }).join('');
}

document.querySelectorAll('.tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        window.currentFilter = this.getAttribute('data-filter');
        renderLibrary();
    });
});

function showAddModal() {
    document.getElementById('addModal').classList.add('show');
    document.getElementById('addTitle').value = '';
    document.getElementById('addAuthor').value = '';
    document.getElementById('addPages').value = '';
    document.getElementById('addCurrentPage').value = '0';
    document.getElementById('addStatus').value = 'reading';
    document.getElementById('addStartDate').value = '';
    document.getElementById('addEndDate').value = '';
    document.getElementById('addNotes').value = '';
    document.getElementById('coverPreview').src = '';
    document.getElementById('coverPreview').style.display = 'none';
    document.getElementById('coverPlaceholder').style.display = 'flex';
    document.getElementById('addCoverUrl').value = '';
    currentCover = '';
    currentRating = 0;
    var stars = document.querySelectorAll('#addStars .star');
    updateStarDisplay(stars, 0);
    document.getElementById('addRatingDisplay').textContent = '0';
}

function closeAddModal() { document.getElementById('addModal').classList.remove('show'); }

function previewCover(e) {
    var file = e.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(evt) {
            currentCover = evt.target.result;
            var img = document.getElementById('coverPreview');
            img.src = currentCover;
            img.style.display = 'block';
            document.getElementById('coverPlaceholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

function previewCoverUrl(url) {
    if (url.trim()) {
        currentCover = url.trim();
        var img = document.getElementById('coverPreview');
        img.src = currentCover;
        img.style.display = 'block';
        document.getElementById('coverPlaceholder').style.display = 'none';
    }
}

function addBook() {
    var title = document.getElementById('addTitle').value.trim();
    var author = document.getElementById('addAuthor').value.trim();
    if (!title || !author) { alert('Kitap adı ve yazar gerekli!'); return; }
    
    books.unshift({
        title: title, author: author,
        pages: document.getElementById('addPages').value || 0,
        currentPage: document.getElementById('addCurrentPage').value || 0,
        status: document.getElementById('addStatus').value,
        startDate: document.getElementById('addStartDate').value,
        endDate: document.getElementById('addEndDate').value,
        notes: document.getElementById('addNotes').value.trim(),
        rating: currentRating, cover: currentCover,
        date: new Date().toISOString()
    });
    
    saveData();
    renderLibrary();
    closeAddModal();
}

function openEditModal(index) {
    editingIndex = index;
    var book = books[index];
    
    document.getElementById('editTitle').value = book.title;
    document.getElementById('editAuthor').value = book.author;
    document.getElementById('editPages').value = book.pages;
    document.getElementById('editCurrentPage').value = book.currentPage || 0;
    document.getElementById('editStatus').value = book.status;
    document.getElementById('editStartDate').value = book.startDate || '';
    document.getElementById('editEndDate').value = book.endDate || '';
    document.getElementById('editNotes').value = book.notes || '';
    
    if (book.cover) {
        editCover = book.cover;
        var img = document.getElementById('editCoverPreview');
        img.src = book.cover;
        img.style.display = 'block';
        document.getElementById('editCoverPlaceholder').style.display = 'none';
        document.getElementById('editCoverUrl').value = book.cover;
    } else {
        editCover = '';
        document.getElementById('editCoverPreview').style.display = 'none';
        document.getElementById('editCoverPlaceholder').style.display = 'flex';
        document.getElementById('editCoverUrl').value = '';
    }
    
    editRating = book.rating || 0;
    var editStars = document.querySelectorAll('#editStars .star');
    updateStarDisplay(editStars, editRating);
    document.getElementById('editRatingDisplay').textContent = editRating > 0 ? editRating.toString() : '0';
    
    document.getElementById('editModal').classList.add('show');
}

function closeEditModal() { document.getElementById('editModal').classList.remove('show'); }

function showDetailModal(index) {
    var book = books[index];
    var statusMap = { completed: 'Okundu', reading: 'Okunuyor', 'on-hold': 'Beklemede', 'to-read': 'Okunacaklar' };
    
    document.getElementById('detailTitle').textContent = book.title;
    document.getElementById('detailAuthor').textContent = book.author;
    document.getElementById('detailStatus').textContent = statusMap[book.status] || book.status;
    document.getElementById('detailStatus').className = 'detail-status status-' + book.status;
    document.getElementById('detailRating').textContent = book.rating ? getStars(book.rating) : 'Puanlanmamış';
    document.getElementById('detailPages').textContent = book.pages || 0;
    document.getElementById('detailCurrentPage').textContent = book.currentPage || 0;
    
    var progress = book.pages > 0 ? Math.min(100, Math.round((book.currentPage || 0) / book.pages * 100)) : 0;
    document.getElementById('detailProgress').textContent = progress + '%';
    
    document.getElementById('detailStartDate').textContent = book.startDate || '-';
    document.getElementById('detailEndDate').textContent = book.endDate || '-';
    
    var notesSection = document.getElementById('detailNotesSection');
    if (book.notes) {
        document.getElementById('detailNotes').textContent = book.notes;
        notesSection.style.display = 'block';
    } else {
        notesSection.style.display = 'none';
    }
    
    var coverImg = document.getElementById('detailCover');
    var coverPlaceholder = document.getElementById('detailCoverPlaceholder');
    if (book.cover) {
        coverImg.src = book.cover;
        coverImg.style.display = 'block';
        coverPlaceholder.style.display = 'none';
    } else {
        coverImg.style.display = 'none';
        coverPlaceholder.style.display = 'flex';
    }
    
    window.detailIndex = index;
    document.getElementById('detailModal').classList.add('show');
}

function closeDetailModal() { document.getElementById('detailModal').classList.remove('show'); }

function editFromDetail() {
    closeDetailModal();
    openEditModal(window.detailIndex);
}

function previewEditCover(e) {
    var file = e.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(evt) {
            editCover = evt.target.result;
            var img = document.getElementById('editCoverPreview');
            img.src = editCover;
            img.style.display = 'block';
            document.getElementById('editCoverPlaceholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

function previewEditCoverUrl(url) {
    if (url.trim()) {
        editCover = url.trim();
        var img = document.getElementById('editCoverPreview');
        img.src = editCover;
        img.style.display = 'block';
        document.getElementById('editCoverPlaceholder').style.display = 'none';
    }
}

function saveEdit() {
    var title = document.getElementById('editTitle').value.trim();
    var author = document.getElementById('editAuthor').value.trim();
    if (!title || !author) { alert('Kitap adı ve yazar gerekli!'); return; }
    
    books[editingIndex] = {
        title: title, author: author,
        pages: document.getElementById('editPages').value || 0,
        currentPage: document.getElementById('editCurrentPage').value || 0,
        status: document.getElementById('editStatus').value,
        startDate: document.getElementById('editStartDate').value,
        endDate: document.getElementById('editEndDate').value,
        notes: document.getElementById('editNotes').value.trim(),
        rating: editRating, cover: editCover,
        date: books[editingIndex].date
    };
    
    saveData();
    renderLibrary();
    closeEditModal();
}

function deleteBook() {
    if (confirm('Silinsin mi?')) {
        books.splice(editingIndex, 1);
        saveData();
        renderLibrary();
        closeEditModal();
    }
}

document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.classList.remove('show');
    });
});