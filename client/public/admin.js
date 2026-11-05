const setStatusMessage = (message, isSuccess = false) => {
  const statusNode = document.querySelector('#updateDataFileStatus');
  statusNode.classList.remove('d-none');
  statusNode.classList.toggle('text-success', isSuccess);
  statusNode.classList.toggle('text-danger', !isSuccess);
  statusNode.innerText = message;
};

const UPDATE_TIMEOUT_MESSAGE = 'Response timed out, but job is still running in the background. Please refresh the page in several minutes.';

const isTimeoutResponse = (response) => {
  return response.status === 408 || response.status === 504 || response.status === 524;
};

const isTimeoutError = (error) => {
  const name = error?.name || '';
  const message = error?.message || '';
  return name === 'AbortError' || name === 'TimeoutError' || /timed?\s*out/i.test(message);
};

const getTitleIds = () => {
  const runtime = window.__RUNTIME_CONFIG__ || {};
  const titleIds = runtime.titleIds || {};
  return {
    adcom: titleIds.adcom || '6bf5',
    ages: titleIds.ages || 'dc4bb'
  };
};

const renderStatus = (statusByTitle) => {
  const titleIds = getTitleIds();
  const adcomStatus = statusByTitle[titleIds.adcom] || {};
  const agesStatus = statusByTitle[titleIds.ages] || {};

  document.querySelector('#existingVersion_6bf5').innerText = adcomStatus.dataVersion || 'Unknown';
  document.querySelector('#existingJob_6bf5').innerText = adcomStatus.jobCompleteAt || 'Unknown';
  document.querySelector('#existingVersion_dc4bb').innerText = agesStatus.dataVersion || 'Unknown';
  document.querySelector('#existingJob_dc4bb').innerText = agesStatus.jobCompleteAt || 'Unknown';
};

const loadStatus = async () => {
  return await fetch('api/admin/status')
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Status request failed (${response.status})`);
      }

      return response.json();
    })
    .then((statusByTitle) => {
      renderStatus(statusByTitle);
      return true;
    })
    .catch((error) => {
      console.error(error);
      setStatusMessage('Unable to load current asset server versions.');
      return false;
    });
};

const postFormUpdateDataFile = async () => {
  setStatusMessage('Please wait ...');

  const payload = {
    title: document.querySelector('input[name="title"]:checked').value,
    version: document.querySelector('#dataVersion').value.trim(),
    password: document.querySelector('#assetServerPassword').value,
    allowDowngrade: document.querySelector('#allowDowngrade').checked
  };

  return await fetch('api/admin/data-file', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
    .then(async (response) => {
      const contentType = response.headers.get('content-type') || '';
      let body;
      if (contentType.includes('application/json')) {
        body = await response.json();
      } else {
        body = { message: await response.text() };
      }

      if (response.ok) {
        setStatusMessage(`Successfully updated data files to version ${payload.version}`, true);
        await loadStatus();
        return;
      }

      if (response.status === 401) {
        setStatusMessage('Incorrect password');
        return;
      }

      if (isTimeoutResponse(response)) {
        setStatusMessage(UPDATE_TIMEOUT_MESSAGE);
        return;
      }

      const message = body?.status || body?.message || body?.detail || `Server error (${response.status})`;
      setStatusMessage(typeof message === 'string' ? message : JSON.stringify(message));
    })
    .catch((error) => {
      console.error(error);
      if (isTimeoutError(error)) {
        setStatusMessage(UPDATE_TIMEOUT_MESSAGE);
        return;
      }

      setStatusMessage('Please check your internet connection');
    });
};

document.addEventListener('DOMContentLoaded', async () => {
  const titleIds = getTitleIds();
  const adcomRadio = document.querySelector('#title_6bf5');
  const agesRadio = document.querySelector('#title_dc4bb');
  const adcomLabel = document.querySelector('label[for="title_6bf5"]');
  const agesLabel = document.querySelector('label[for="title_dc4bb"]');

  adcomRadio.value = titleIds.adcom;
  agesRadio.value = titleIds.ages;
  adcomLabel.innerText = `AdCom (${titleIds.adcom})`;
  agesLabel.innerText = `Ages (${titleIds.ages})`;

  await loadStatus();
});

document.querySelector('#formSubmitUpdateDataFile').addEventListener('click', () => {
  postFormUpdateDataFile();
});
