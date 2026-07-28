const form = document.getElementById('login-form');
const errorEl = document.getElementById('login-error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.hidden = true;
  const username = document.getElementById('f-username').value;
  const password = document.getElementById('f-password').value;

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const params = new URLSearchParams(location.search);
      location.href = params.get('next') || '/';
      return;
    }
    const data = await res.json().catch(() => ({}));
    errorEl.textContent = data.error || 'Sign in failed.';
    errorEl.hidden = false;
  } catch {
    errorEl.textContent = 'Could not reach the server. Try again.';
    errorEl.hidden = false;
  } finally {
    submitBtn.disabled = false;
  }
});
