let reviews = JSON.parse(localStorage.getItem('reviews')) || [];
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
let isAdmin = localStorage.getItem('isAdmin') === 'true';

const loginBtn = document.getElementById('loginBtn');
const reviewForm = document.getElementById('reviewForm');
const reviewsList = document.getElementById('reviewsList');
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const closeModal = document.querySelector('.close');
const stars = document.querySelectorAll('.star');
const ratingValue = document.getElementById('ratingValue');

let currentRating = 0;

document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  renderReviews();
});

loginBtn.addEventListener('click', () => {
  if (isLoggedIn) {
    logout();
  } else {
    loginModal.style.display = 'block';
  }
});

closeModal.addEventListener('click', () => {
  loginModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === loginModal) loginModal.style.display = 'none';
});

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (username === '' || password === '') {
    alert('Введите логин и пароль!');
    return;
  }

  isLoggedIn = true;
  localStorage.setItem('isLoggedIn', 'true');

  if (username === 'admin' && password === 'admin123') {
    isAdmin = true;
    localStorage.setItem('isAdmin', 'true');
  } else {
    isAdmin = false;
    localStorage.setItem('isAdmin', 'false');
  }

  loginModal.style.display = 'none';
  loginForm.reset();
  updateUI();
});

stars.forEach(star => {
  star.addEventListener('mouseover', () => {
    const value = Number(star.dataset.value);
    highlightStars(value);
  });

  star.addEventListener('mouseout', () => {
    highlightStars(currentRating);
  });

  star.addEventListener('click', () => {
    currentRating = Number(star.dataset.value);
    ratingValue.textContent = currentRating;
    highlightStars(currentRating);
  });
});

reviewForm.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!isLoggedIn) {
    alert('Сначала авторизуйтесь!');
    return;
  }

  if (currentRating === 0) {
    alert('Выберите оценку!');
    return;
  }

  const author = document.getElementById('author').value.trim();
  const text = document.getElementById('text').value.trim();

  if (author === '' || text === '') {
    alert('Заполните имя и отзыв!');
    return;
  }

  const review = {
    id: Date.now(),
    author,
    text,
    rating: currentRating,
    date: new Date().toLocaleDateString('ru-RU')
  };

  reviews.unshift(review);
  localStorage.setItem('reviews', JSON.stringify(reviews));

  reviewForm.reset();
  currentRating = 0;
  ratingValue.textContent = '0';
  highlightStars(0);
  renderReviews();
});

function highlightStars(value) {
  stars.forEach((s, i) => {
    if (i < value) {
      s.classList.add('active');
    } else {
      s.classList.remove('active');
    }
  });
}

function deleteReview(id) {
  if (!isAdmin) return;

  reviews = reviews.filter(review => review.id !== id);
  localStorage.setItem('reviews', JSON.stringify(reviews));
  renderReviews();
}

function updateUI() {
  let status = document.getElementById('loginStatus');

  if (!status) {
    status = document.createElement('div');
    status.id = 'loginStatus';
    loginBtn.parentNode.appendChild(status);
  }

  status.textContent = isLoggedIn
    ? (isAdmin ? '👑 Админ онлайн | ' : '✅ Пользователь онлайн | ')
    : '❌ Не авторизован | ';

  status.style.color = isAdmin ? '#ff416c' : '#00a8ff';
  status.style.fontWeight = 'bold';
  status.style.marginTop = '1rem';

  reviewForm.style.display = isLoggedIn ? 'block' : 'none';
  loginBtn.textContent = isLoggedIn ? 'Выйти' : 'Авторизоваться';

  renderReviews();
}

function logout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('isAdmin');
  isLoggedIn = false;
  isAdmin = false;
  updateUI();
}

function renderReviews() {
  reviewsList.innerHTML = '';

  reviews.forEach(review => {
    const item = document.createElement('div');
    item.className = 'review-item';

    const content = document.createElement('div');
    content.className = 'review-content';
    content.innerHTML = `
      <div class="review-author">${review.author}</div>
      <div class="review-text">${review.text}</div>
      <div class="review-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)} (${review.rating}/5)</div>
      <small>${review.date}</small>
    `;

    item.appendChild(content);

    if (isAdmin) {
      const btn = document.createElement('button');
      btn.className = 'delete-btn';
      btn.textContent = 'Удалить';
      btn.addEventListener('click', () => deleteReview(review.id));
      item.appendChild(btn);
    }

    reviewsList.appendChild(item);
  });
}