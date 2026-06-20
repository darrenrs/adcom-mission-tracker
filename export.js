(function () {
  // Collect everything from localStorage
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    data[key] = localStorage.getItem(key);
  }

  const json = JSON.stringify(data);

  function toBase64(str) {
    const utf8Bytes = encodeURIComponent(str).replace(
      /%([0-9A-F]{2})/g,
      (_, hex) => String.fromCharCode(parseInt(hex, 16))
    );
    return btoa(utf8Bytes);
  }

  const encoded = toBase64(json);

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://idlegametools.com/adcom-mission-tracker/api/import';

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'payload';
  input.value = encoded;
  form.appendChild(input);

  const originInput = document.createElement('input');
  originInput.type = 'hidden';
  originInput.name = 'sourceUrl';
  originInput.value = window.location.href;
  form.appendChild(originInput);

  document.body.appendChild(form);
  form.submit();
})();